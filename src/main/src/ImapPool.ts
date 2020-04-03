import { ImapConn } from './ImapConn';
import { ImapBox } from '../declarations/ImapBox';
import { SerializedAccount } from '../../data/SerializedAccount';

export class ImapPool {
	private static POOL_SIZE: number = 4;

	private pool: ImapConn[] = [];

	private connQueue: {box: string, cb: (conn: ImapConn) => void}[] = [];

	constructor(credentials: SerializedAccount) {
		for (let i = 0; i < ImapPool.POOL_SIZE; i++) {
			this.pool.push(new ImapConn(credentials, this.connectionFree.bind(this)));
		}
	}

	private async connectionFree(conn: ImapConn) {
		if (this.connQueue.length > 0) {
			const queued = this.connQueue.splice(0, 1)[0];
			if (await conn.pleaseUseBox(queued.box)) queued.cb(conn);
		}
	}

	async connect() {
		await Promise.all(this.pool.map(async (conn: ImapConn) => await conn.connect()));
	}

	async getBoxList(): Promise<{[key: string]: ImapBox}> {
		return await this.pool[0].getBoxList();
	}

	box(boxName: string): {
		seqSearch: (criteria: any[]) => Promise<number[]>, 
		uidSearch: (criteria: any[]) => Promise<number[]>, 
		seqFetch: (source: any[], options: any, callback: (msg: any, seqno: number) => void) => Promise<unknown>, 
		uidFetch: (source: any[], options: any, callback: (msg: any, seqno: number) => void) => Promise<unknown>
	} {
		return {
			seqSearch: this.search.bind(this, boxName, "seq"),
			uidSearch: this.search.bind(this, boxName, "uid"),
			seqFetch: this.fetch.bind(this, boxName, "seq"),
			uidFetch: this.fetch.bind(this, boxName, "uid")
		}
	}

	private async getBoxConn(boxName: string): Promise<ImapConn> {
		// Check if there's already a connection open to the box.
		for (let conn of this.pool) {
			if (conn.getCurrentBox() && conn.getCurrentBox()!.name == boxName) {
				if (await conn.pleaseUseBox(boxName)) return conn; 
			}
		}

		// Try to open an unused conn to the box.
		for (let conn of this.pool) {
			if (await conn.pleaseUseBox(boxName)) return conn; 
		}

		return await new Promise((resolve: (conn: ImapConn) => void) => {
			this.connQueue.push({box: boxName, cb: (conn) => resolve(conn)});
		});
	}

	private async search(boxName: string, mode: string, criteria: any[]): Promise<number[]> {
		const conn = await this.getBoxConn(boxName);
		return await conn.search(mode, criteria);
	}

	private async fetch(boxName: string, mode: string, source: any[], options: any, cb: (msg: any, seqno: number) => void) {
		const conn = await this.getBoxConn(boxName);
		return await conn.fetch(mode, source, options, cb);
	}
}
