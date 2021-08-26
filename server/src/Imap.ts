import md5 from 'md5';

import RawImap, { MailBoxes as RawBoxes } from 'imap';

/** Credentials and properties used to establish an IMAP connection. */

export interface ConnectionProperties {
	username: string;
	password: string;
	host: string;
	port: number;
	tls: boolean;
}


/**
 * Mailbox types (attributes).
 * Only the attributes relevant to Aether are included,
 * and some are named differently to better match interface language.
 */

export enum MailboxType {
	Box = 'NORMAL_BOX',
	All = '\\All',
	Archive = '\\Archive',
	Drafts = '\\Drafts',
	Starred = '\\Flagged',
	Important = '\\Important',
	Inbox = '\\Inbox',
	Spam = '\\Junk',
	Sent = '\\Sent',
	Trash = '\\Trash'
}


/**
 * Message flags (keywords).
 * Only the flags relevant to Aether are included,
 * and some are named differently to better match interface language.
 */

export enum MessageFlag {
	Read = '\\Seen',
	Important = '\\Flagged',
	Deleted = '\\Deleted',
	Draft = '\\Draft',
	Active = '$ACTIVE'
}


/** An IMAP Box. */

export interface Mailbox {
	name: string;
	path: string;
	delimiter: string;
	type: MailboxType;
	treeTypes: Set<MailboxType>;
	parent?: string;
	children: string[];
}


/** A simple key-value set of raw message headers. */

export type RawMessageHeaders = Record<string, string>;

/** Raw message attributes. */

export type MessageAttrs = {
	date: Date;
	flags: Set<MessageFlag>;
	uid: number;
};


/**
 * A parsed conversation participant (sender / receiver).
 * Some participants don't have names included.
 */

export interface Participant { name: string | undefined; address: string };


/** Headers for an email message, identified by a persistant ID string. */

export interface Message {
	to: Participant[];
	from: Participant;
	date: Date;
	subject: string;
	messageId: string;
	active: boolean;
	id: number;
	boxId: number;
	replyTo: string;
	references: string[];
}


/**
 * A wrapper on a node-imap connection that provides
 * a promise-based wrapper to an IMAP connection.
 * Returns more friendly interfaces than the raw connection,
 * and keeps track of the logged in state and current box.
 */

export default class Imap {
	private raw: RawImap;
	private connected: boolean = false;

	private boxes: Mailbox[] = [];
	private box: Mailbox | undefined = undefined;


	/**
	 * Constructs an Imap instance, but does not connect.
	 * connect() must be called before accessing the server.
	 *
	 * @param props - Connection properties to initialize with.
	 */

	constructor(props: ConnectionProperties) {
		this.raw = new RawImap({
			user: props.username,
			password: props.password,
			host: props.host,
			port: props.port,
			tls: props.tls
		});
	}


	/**
	 * Connects to the remote IMAP server.
	 *
	 * @returns a promise resolving upon connection or rejecting with a connection error.
	 */

	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.connected) {
				reject('Already connected.');
				return;
			}

			this.raw.once('end', () => this.connected = false);
			this.raw.once('error', (error: any) => reject(error));
			this.raw.once('ready', async () => {
				this.connected = true;
				this.boxes = await this.listBoxes();
				resolve();
			});

			this.raw.connect();
		});
	}


	/**
	 * Gets the current connection state.
	 *
	 * @returns a boolean indicating the connection state of the instance.
	 */

	isConnected(): boolean {
		return this.connected;
	}


	/**
	 * Gets a flat list of all the mailboxes mailboxes.
	 *
	 * @returns a promise resolving to an array of mailboxes, or rejecting with an error.
	 */

	listBoxes(): Promise<Mailbox[]> {
		return new Promise((resolve, reject) => {
			if (!this.connected) reject('Cannot get box when the connection is closed.');
			this.raw.getBoxes((err, boxes) => {
				if (err) {
					reject(err);
					return;
				}

				const foundBoxes: Mailbox[] = [];

				function traverseBoxes(boxes: RawBoxes, path: string, parent: string | undefined, treeTypes: Set<MailboxType>) {
					for (let boxName in boxes) {
						if ({}.hasOwnProperty.call(boxes, boxName)) {
							const box = boxes[boxName];
							const thisPath = path + boxName + box.delimiter;
							const type = (box as any).special_use_attrib as MailboxType ??
								(boxName === 'INBOX' ? MailboxType.Inbox : MailboxType.Box);
							const thisTreeTypes = new Set([ ...treeTypes, type ]);

							foundBoxes.push({
								name: boxName,
								path: path + boxName,
								delimiter: box.delimiter,
								type,
								treeTypes: thisTreeTypes,
								parent,
								children: Object.keys(box.children ?? []).map(name => thisPath + name)
							});

							traverseBoxes(box.children ?? [], thisPath, path + boxName, thisTreeTypes);
						}
					}
				}

				traverseBoxes(boxes, '', undefined, new Set());
				resolve(foundBoxes);
			});
		});
	}


	/**
	 * Attempts to open a box with the path provided, and returns that box.
	 *
	 * @param box - The path of the box to open.
	 * @returns a raw node-imap box instance.
	 */

	openBox(box: string): Promise<Mailbox> {
		return new Promise((resolve, reject) => {
			if (!this.connected) reject('Cannot get box when the connection is closed.');

			this.raw.openBox(box, false, (err, box) => {
				if (err) {
					reject(err);
					return;
				}

				this.box = this.boxes.filter(b => b.path === box.name)[0];
				resolve(this.box);
			});
		});
	}


	/**
	 * Gets the name of the currently opened box.
	 *
	 * @returns the name of the currently opened box, or undefined if none are open.
	 */

	getCurrentBox(): string | undefined {
		return this.box?.name;
	}


	/**
	 * Fetches a set of messages from the server matching the query provided.
	 * This query should be a string matching the IMAP query selector format.
	 *
	 * @param query - A query to send to the server.
	 * @param seq - Whether or not the query is a sequence query or an ID query.
	 * @returns a promise resolving to a record of messages, indexed by persistant Message ID, or rejecting with an error.
	 */

	async fetchMessages(query: string | number | number[]): Promise<Record<string, Message>> {
		const bodies = await this.fetchMessageHeaders(query, false,
			'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES)');
		const messages: Record<string, Message> = {};

		Object.keys(bodies).forEach(idStr => {
			const id = parseInt(idStr, 10);
			const headers = bodies[id].headers;
			const attrs = bodies[id].attrs;

			messages[headers['MESSAGE-ID']] = {
				to: this.parseParticipants(headers.TO ?? ''),
				from: this.parseParticipants(headers.FROM ?? '')[0],
				subject: headers.SUBJECT,
				date: attrs.date,

				id: id,
				boxId: attrs.uid,
				messageId: headers['MESSAGE-ID'] || `HASH:${md5(attrs.date.toString())}:${md5(headers.SUBJECT)}`,
				active: attrs.flags.has(MessageFlag.Active) || this.box!.type === MailboxType.Inbox,

				replyTo: headers['IN-REPLY-TO'],
				references: (headers.REFERENCES ?? '').split(' ').map(s => s.trim()).filter(r => r)
			};
		});

		return messages;
	}


	/**
	 * Fetches a set of message headers from the server matching the query provided.
	 * This query should match the node-imap query selector format.
	 * The bodies should be presented in the node-imap format, e.g.
	 * 'HEADER.FIELDS (FROM TO SUBJECT DATE)'
	 * Attributes are also returned.
	 *
	 * @param query - A query to send to the server.
	 * @param seq - Whether or not the query is a sequence query or an ID query.
	 * @param bodies - The string identifying the bodies to fetch.
	 * @returns a promise resolving to a record of message bodies, indexed by persistant Message ID, or rejecting with an error.
	 */

	fetchMessageHeaders(query: string | number | number[], seq: boolean, bodies: string):
	Promise<Record<number, { headers: RawMessageHeaders; attrs: MessageAttrs }>> {
		return new Promise((resolve, reject) => {
			if (!this.connected) reject('Cannot fetch messages when the connection is closed.');
			if (!this.box) reject('Cannot fetch messages when there is no current box.');

			let fetchRoot = seq ? this.raw.seq : this.raw;

			const rawAttrs: Record<number, any> = {};
			const rawHeaders: Record<number, string> = {};
			const fetch = fetchRoot.fetch(query, { bodies: bodies, struct: false });

			fetch.on('error', err => reject(err));

			fetch.on('message', (msg, id) => {
				rawHeaders[id] = '';
				msg.on('body', stream => stream.on('data', (chunk) => rawHeaders[id] += chunk.toString('utf8')));
		    msg.once('attributes', (attrs) => rawAttrs[id] = attrs);
			});

			fetch.on('end', () => {
				const messages: Record<number, { headers: RawMessageHeaders; attrs: MessageAttrs }> = {};
				Object.keys(rawHeaders).forEach(idStr => {
					const id = parseInt(idStr, 10);
					const finalHeaders: Record<string, string> = {};
					rawHeaders[id].split(/\r?\n(?=[A-z:\-_]+)/g).map(h => h.trim()).filter(h => h).forEach(header => {
						const delimiter = header.indexOf(':');
						const name = header.substr(0, delimiter).trim();
						const value = header.substr(delimiter + 1).trim();
						finalHeaders[name.toUpperCase()] = value;
					});
					const myAttrs = rawAttrs[id];

					messages[id] = {
						headers: finalHeaders,
						attrs: {
							uid: myAttrs.uid,
							date: myAttrs.date,
							flags: new Set(myAttrs.flags)
						}
					};
				});

				resolve(messages);
			});
		});
	}


	/**
	 * Parses a participant list,
	 * e.g 'Auri Collings <me@auri.xyz>, nicole@aurailus.design'
	 * into a parsed array of Participant objects.
	 * This function WILL return invalid results if a name contains a comma.
	 *
	 * @returns an array of Participants.
	 */

	private parseParticipants(header: string): Participant[] {
		return header.split(',').map(raw => {
			const delimiter = raw.indexOf('<');
			if (delimiter === -1) return { name: undefined, address: raw.trim() };

			const name = raw.substr(0, delimiter).replace(/^[\s'"]+/g, '').trim().replace(/[\s'"]+$/g, '');
			const address = raw.substr(delimiter + 1).replace(/[<>]/g, '').replace(/^[\s'"]+/g, '').trim().replace(/[\s'"]+$/g, '');

			return { name: name ? name : undefined, address };
		});
	}
}
