import Imap from 'imap';
import EventEmitter from 'events';

export enum FetchMode { SEQ, UID };

export type FetchSpecifier = string | string[] | number | number[];

export interface FetchMessage {
	headers: string;
	attrs: Imap.ImapMessageAttributes;
}

export const FETCH_DEFAULT_BODIES = 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)';

export interface ConnectionProperties {
	user: string;
	password: string;
	host: string;
	port: number;
	tls: boolean;
}

export default class ImapConnection {
	readonly event: EventEmitter = new EventEmitter();

	private conn: Imap;
	private connected: boolean = false;
	private currentBox: string | null = null;
	private currentBoxProps: Imap.Box | null = null;

	private operationNext: number = 0;
	private operationsPending: Set<number> = new Set();

	constructor(connectionProps: ConnectionProperties) {
		this.conn = new Imap(connectionProps);
	}

	/**
	 * Checks if the connection is idle.
	 *
	 * @returns a boolean indicating if the connection is idle.
	 */

	 isIdle(): boolean {
		if (!this.connected) throw new Error('Attempted to check if an unconnected connection is idle.');
		return this.operationsPending.size === 0;
	}

	/**
	 * Tracks and executes the provided function to prevent disconnection
	 * or box changes occuring while it is in progress. All operations that
	 * need to access the open box on the remote server should be wrapped
	 * by this function. Propagates the returned values or errors up.
	 *
	 * @param fn - The function to execute.
	 * @returns the function's return value.
	 */

	private executeOperation<T = any>(fn: () => Promise<T>): Promise<T> {
		return new Promise(async (resolve, reject) => {
			if (!this.connected) reject(new Error(
				'Attempted to perform an operation on an unconnected connection.'));

			const operation = this.operationNext++;
			this.operationsPending.add(operation);

			try {
				this.operationsPending.delete(operation);
				resolve(await fn());
				if (this.isIdle()) setTimeout(() => this.event.emit('idle'), 0);
			}
			catch (e: unknown) {
				this.operationsPending.delete(operation);
				reject(e);
				if (this.isIdle()) setTimeout(() => this.event.emit('idle'), 0);
			}
		});
	}

	/**
	 * Initiates the Imap connection, resolves when complete.
	 *
	 * @returns a promise that resolves upon connection or rejects with an error.
	 */

	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.connected) {
				reject(new Error('Attempted to connect while already connected.'));
				return;
			}

			this.conn.once('end', () => this.connected = false);
			this.conn.once('error', (error: any) => reject(error));
			this.conn.once('ready', async () => {
				this.connected = true;
				resolve();
			});

			this.conn.connect();
		});
	}

	/**
	 * Checks if the connection is connected.
	 *
	 * @returns a boolean indicating if there is an active connection.
	 */

	isConnected(): boolean {
		return this.connected;
	}

	/**
	 * Opens the specified box (safely). Throws if there are pending operations.
	 *
	 * @param path - The path of the box to open.
	 * @returns the box that was opened.
	 */

	async openBox(path: string): Promise<Imap.Box> {
		return this.executeOperation(() => new Promise((resolve, reject) => {
			if (!this.connected) reject(new Error('Tried to open a box while not connected.'));
			if (!this.isIdle()) reject(new Error('Tried to change box while the connection was not idle.'));

			this.currentBox = null;
			this.conn.openBox(path, false, (err, box) => {
				if (err) reject(err);
				else {
					this.currentBox = path;
					this.currentBoxProps = JSON.parse(JSON.stringify(box));
					resolve(this.currentBoxProps!);
				}
			});
		}));
	}

	/**
	 * Gets the name of the currently open box, if one is open.
	 *
	 * @returns the name of the box that is open, or null if none are open.
	 */

	getOpenBox(): string | null {
		return this.currentBox;
	}

	/**
	 * Gets the properties of the currently open box, or throws if there isn't one open.
	 *
	 * @returns an Imap.Box for the currently open box.
	 */

	getOpenBoxProps(): Imap.Box {
		if (!this.currentBoxProps) throw new Error('Tried to get box props when there wasn\'t an open box.');
		return this.currentBoxProps;
	}

	/**
	 * Gets a tree of boxes on the server.
	 *
	 * @returns a tree of imap mailboxes.
	 */

	getBoxes(): Promise<Imap.MailBoxes> {
		return new Promise((resolve, reject) => {
			this.conn.getBoxes((err, boxes) => {
				if (err) reject(err);
				else resolve(boxes);
			});
		});
	}

	/**
	 * Fetches messages either by SeqNo or by UID and returns their raw headers and attributes.
	 *
	 * @param mode - The mode to fetch with.
	 * @param query - The query to send to the server.
	 * @param bodies - The header bodies to fetch.
	 * @returns a map of messages indexed by UID or SeqNo.
	 */

	async fetchMessages(mode: FetchMode, query: FetchSpecifier,
		bodies: string = FETCH_DEFAULT_BODIES): Promise<Map<number, FetchMessage>> {

		return this.executeOperation(() => new Promise((resolve, reject) => {
			const fetchRoot = mode === FetchMode.SEQ ? this.conn.seq : this.conn;

			const messages: Map<number, FetchMessage> = new Map();
			const fetch = fetchRoot.fetch(query, { bodies, struct: false });

			fetch.on('error', e => reject(e));

			fetch.on('message', (msg, id) => {
				messages.set(id, { headers: '', attrs: null as any });

				msg.on('body', stream => stream.on('data',
					chunk => messages.get(id)!.headers += chunk.toString('utf8')));

				msg.once('attributes',
					attrs => messages.get(id)!.attrs = attrs);
			});

			fetch.on('end', () => {
				resolve(messages);
			});
		}));
	}

	/**
	 * Fetches messages by SeqNo and returns their raw headers and attributes.
	 *
	 * @param query - The query to send to the server.
	 * @param bodies - The header bodies to fetch.
	 * @returns a map of messages indexed by SeqNo.
	 */

	async fetchMessagesBySeqNo(query: FetchSpecifier, bodies?: string):  Promise<Map<number, FetchMessage>> {
		return this.fetchMessages(FetchMode.SEQ, query, bodies);
	}

	/**
	 * Fetches messages by UID and returns their raw headers and attributes.
	 *
	 * @param query - The query to send to the server.
	 * @param bodies - The header bodies to fetch.
	 * @returns a map of messages indexed by UID.
	 */

	async fetchMessagesByUID(query: FetchSpecifier, bodies?: string):  Promise<Map<number, FetchMessage>> {
		return this.fetchMessages(FetchMode.UID, query, bodies);
	}
}
