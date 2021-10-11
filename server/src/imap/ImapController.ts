import EventEmitter from 'events';

import Log from '../Log';
import ImapConnection, { ConnectionProperties } from './ImapConnection';

export const DEFAULT_CONNECTIONS = 6;

export default class ImapController {
	readonly event: EventEmitter = new EventEmitter();

	private address: string;
	private connected: boolean = false;
	private connections: ImapConnection[] = [];

	private awaitingIdle: ((conn: ImapConnection) => void)[] = [];

	constructor(connectionProps: ConnectionProperties, connectionCount: number = DEFAULT_CONNECTIONS) {
		this.address = connectionProps.user;
		for (let i = 0; i < connectionCount; i++) this.connections.push(new ImapConnection(connectionProps));

		this.connections.forEach(conn => conn.event.on('idle',
			() => this.event.emit('idle', conn)));

		this.event.on('idle', (conn: ImapConnection) => {
			if (this.awaitingIdle.length <= 0) return;
			this.awaitingIdle[0](conn);
			this.awaitingIdle.splice(0, 1);
		});
	}

	async connect() {
		await Promise.all(this.connections.map(async (conn, i) => {
			Log.perfStart(`Connection ${i + 1} for ${this.address}`);
			await conn.connect();
			Log.perfEnd(`Connection ${i + 1} for ${this.address}`);
		}));
		this.connected = true;
	}

	async get(path?: string): Promise<ImapConnection> {
		if (!this.connected) throw new Error('Tried to access a box when the connections aren\'t connected.');

		if (path === undefined) return this.connections[Math.floor(Math.random() * 100000) % this.connections.length];

		for (let conn of this.connections) {
			if (conn.getOpenBox() === path) {
				return conn;
			}
		}

		for (let conn of this.connections) {
			if (conn.getOpenBox() === null) {
				await conn.openBox(path);
				return conn;
			}
		}

		for (let conn of this.connections) {
			if (!conn.isIdle()) continue;
			await conn.openBox(path);
			return conn;
		}

		return new Promise((resolve) =>
			this.awaitingIdle.push((conn: ImapConnection) =>
				conn.openBox(path).then(() => resolve(conn))));
	}
}
