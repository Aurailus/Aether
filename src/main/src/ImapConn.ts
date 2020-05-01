const Imap = require('imap');
import { RawImap } from '../declarations/RawImap';
import { ImapBox } from '../declarations/ImapBox';
import { SerializedAccount } from '../../data/SerializedAccount';

export class Lock {
	ttl: number = 0.75;

	private locks: any = {};
	private lastLockedAt: number = Date.now();

	private cb: any = false;
	free: boolean = true;
	
	onExpire(cb: any) {
		this.cb = cb;
	}

	acquire(): Object {
		let lock = new Object();
		//@ts-ignore
		this.locks[lock] = true;
		this.free = false;
		return lock;
	}

	release(lock: Object) {
		//@ts-ignore
		delete this.locks[lock];
		if (Object.keys(this.locks).length == 0) this.refresh();
	}

	refresh() {
		this.lastLockedAt = Date.now();
		setTimeout(() => {
			if ((Date.now() - this.lastLockedAt >= this.ttl * 1000) && !this.free) {
				this.cb();
				this.free = true;
			}
		}, this.ttl * 1000)
	}
}

export class ImapConn {
	private conn: RawImap;
	private lock: Lock;
	private onFree: (conn: ImapConn) => void;
	private connected: boolean = false;

	private currentBox: ImapBox|null = null;

	constructor(acct: SerializedAccount, onFree: (conn: ImapConn) => void) {
		this.conn = new Imap({
			user: acct.imap_user,
			password: acct.password,
			host: acct.imap_host,
			port: acct.imap_port,
			tls: true
		});

		this.lock = new Lock();
		this.onFree = onFree;
		this.lock.onExpire(() => this.onFree(this));
	}

	//
	// Connect (or reconnect) to the remote server.
	//
	async connect() {
		await new Promise((resolve: () => void, reject: (error: string) => void) => {
			if (this.connected) { resolve(); return; }

			this.conn.once('ready', () => { 
				this.connected = true; 

				this.conn.once('close', (error: boolean) => {
					if (error) throw "Connection closed with an error";
					this.connected = false;
					this.currentBox = null;
					this.conn.connect();
				});
				
				resolve(); 
			});

			this.conn.once('error', reject);
			this.conn.connect();
		});
	}

	//
	// Get the list of boxes on the remote server.
	//
	async getBoxList(): Promise<{[key: string]: ImapBox}> {
		await this.connect();

		return new Promise((resolve: (boxList: {[key: string]: ImapBox}) => void, reject: (error: string) => void) => {
			this.conn.getBoxes(async (e: string, boxList: {[key: string]: ImapBox}) => {
				if (e) reject(`Failed to get box list, error: ${e}`);
				resolve(boxList);
			});
		});
	}

	// 
	// Get the currently open box.
	// 
	getCurrentBox(): ImapBox|null {
		return this.currentBox;
	}

	//
	// Opens the requested box, and returns it.
	//
	private async useBox(box: string): Promise<ImapBox> {
		const lock = this.lock.acquire();
		await this.connect();

		return new Promise((resolve: (box: ImapBox) => void, reject: (error: string) => void) => {
			this.conn.openBox(box, false, (e: string, boxProps: ImapBox) => {
				if (e) reject(`Failed to open box, error: ${e}`);
				this.currentBox = boxProps;
				this.lock.release(lock);
				resolve(boxProps);
			});
		});
	}

	//
	// If this conn is already connected to the requested box, returns true.
	// If the conn is not currently in use, it connects to box, then returns true.
	// If the conn is in use but not connected to the requested box, returns false.
	//
	async pleaseUseBox(box: string): Promise<boolean> {
		if (this.currentBox && this.currentBox.name == box) {
			this.lock.refresh();
			return true;
		}
		else if (this.lock.free) {
			await this.useBox(box);
			return true;
		}
		else return false;
	}

	async search(mode: string, criteria: any[]) {
		const lock = this.lock.acquire();
		await this.connect();

		const fn = (mode == "seq" ? this.conn.seq.search.bind(this.conn.seq) : this.conn.search.bind(this.conn));
		return new Promise((resolve: (res: number[]) => void, reject: (error: string) => void) => {
			fn(criteria, (err: string, res: number[]) => {
				if (err) reject(err);

				this.lock.release(lock);
				resolve(res);
			});
		});
	}

	async fetch(mode: string, source: any[], options: any, cb: (msg: any, num: number) => void) {
		const lock = this.lock.acquire();
		await this.connect();

		const fn = (mode == "seq" ? this.conn.seq.fetch.bind(this.conn.seq) : this.conn.fetch.bind(this.conn));

		return new Promise((resolve: () => void, reject: (error: string) => void) => {
			let f = fn(source, options);

			f.on('message', cb);

			f.once('error', (err: any) => reject(`Fetch error: ${err}`));
	    f.once('end', () => {
	    	this.lock.release(lock);
	    	resolve();
	  	});
		});
	}
}
