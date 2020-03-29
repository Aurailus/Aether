import { ImapBox } from '../../data/ImapBox';
import { AccountProps } from '../../data/AccountProps';
import { SerializedAccount } from '../../data/SerializedAccount';

import { InternalImapConn } from '../declarations/InternalImapConn';

import { LocalStore } from './LocalStore';

const Imap = require('imap');

export class ImapAccount {
	readonly props: AccountProps;

	private localStore: LocalStore;
	private conn: InternalImapConn;
	private currentBox: string;

	constructor(props: SerializedAccount) {
		this.conn = new Imap(props);

		this.currentBox = "";

		this.props = {
			id: props.id,
			image: props.displayImage,
			name: props.displayName,
			address: props.user,
			hasUnread: true
		}
		
		this.localStore = new LocalStore(this, this.conn);
	}

	//
	// Initialize the InternalImapConn connection, and then update the LocalStore cache. 
	// Returns self on success, and the email address on failure.
	//

	connect(): Promise<ImapAccount> {
		return new Promise((resolve: (conn: ImapAccount) => void, reject: (failedAccount: string) => void) => {

			console.log('starting')

			this.conn.once('ready', async () =>
				this.localStore.updateCache().then(() => resolve(this))
					.catch(reject.bind(this, this.props.address)))

			this.conn.once('error', reject.bind(this, this.props.address));

			this.conn.connect();
		});
	}

	getAllBoxes(): Promise<{[key: string]: ImapBox}> {
		return new Promise((resolve: (boxes: {[key: string]: ImapBox}) => void, reject: (err: string) => void) => {
			this.conn.getBoxes((err: string, boxes: {[key: string]: ImapBox}) => {
				if (err) reject(err);
				else resolve(boxes);
			});
		});
	}

	// openBox(box: string): Promise<any> {
	// 	this.currentBox = box;
	// 	return new Promise((resolve: (box: any) => void, reject: (err: string) => void) => {
	// 		this.conn.openBox(box, false, (err: string, box: any) => {
	// 			if (err) reject(err);
	// 			else resolve(box);
	// 		});
	// 	});
	// }

	// getBox(): string {
	// 	return this.currentBox;
	// }

	// getMessageHeaders(message: number | string | number[], callback: (headers: any, attrs: any) => void) {
	// 	return new Promise((resolve: (box: any) => void, reject: (err: string) => void) => {
	// 		let f = this.conn.fetch(message, {
	// 			bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
	// 			struct: true
	// 		});

	// 		f.on('message', (msg: any, seqno: number) => {
	// 			let header: any;
	// 			let attrs: any;

	// 			msg.on('body', function(stream: any) {
	//         let buffer = "";
	//         stream.on('data', (chunk: any) => buffer += chunk.toString('utf8'));
	//         stream.once('end', () => header = Imap.parseHeader(buffer));
	//       });

	// 			msg.on('attributes', (a: any) => attrs = a);
	// 			msg.once('end', () => callback(header, attrs));
	// 		});

	// 		f.once('error', (err: any) => reject(err));
	//     f.once('end', resolve);
	// 	});
	// }

	// getMessageContents(message: number | string | number[], callback: (body: any, attrs: any) => void) {
	// 	return new Promise((resolve: () => void, reject: (err: string) => void) => {
	// 		let f = this.conn.fetch(message, {
	// 			bodies: "",
	// 			struct: true
	// 		});

	// 		f.on('message', (msg: any, seqno: number) => {
	// 			let body: string = "";
	// 			let attrs: any;

	// 			msg.on('body', function(stream: any) {
	//         let buffer = "";
	//         stream.on('data', (chunk: any) => buffer += chunk.toString('utf8'));
	//         stream.once('end', () => body = buffer);
	//       });

	// 			msg.on('attributes', (a: any) => attrs = a);
	// 			msg.once('end', () => callback(body, attrs));
	// 		});

	// 		f.once('error', (err: any) => reject(err));
	//     f.once('end', resolve);
	// 	});
	// }

	// getMessageUIDs(): Promise<number[]> {
	// 	return new Promise((resolve: (box: number[]) => void, reject: (err: string) => void) => {
	// 		this.conn.search(['ALL'], (err: string, res: number[]) => {
	// 				if (err) reject(err);
	// 				else resolve(res);
	// 		});
	// 	});
	// }
}
