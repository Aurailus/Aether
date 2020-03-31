import { ImapConn } from '../declarations/ImapConn';
// import { ImapBox } from '../declarations/ImapBox';

import { AccountProps } from '../../data/AccountProps';
import { SerializedAccount } from '../../data/SerializedAccount';
import { ConversationListing } from '../../data/ConversationListing';

import { LocalStore } from './LocalStore';

const Imap = require('imap');

export class ImapAccount {
	readonly props: AccountProps;

	private localStore: LocalStore;
	private conn: ImapConn;

	constructor(props: SerializedAccount) {
		this.conn = new Imap(props);

		this.props = {
			id: props.id,
			address: props.user,
			
			name: props.displayName,
			image: props.displayImage,

			loaded: false,
			hasUnread: false
		}
		
		this.localStore = new LocalStore(this, this.conn);
	}

	//
	// Set up the account, which triggers the localStore to update the cache.
	//
	async setup() {
		await this.localStore.setup();
	}

	//
	// Initialize the InternalImapConn connection, and then update the LocalStore cache. 
	// Returns self on success, and the email address on failure.
	//
	connect(): Promise<ImapAccount> {
		return new Promise((resolve: (conn: ImapAccount) => void, reject: (failedAccount: string) => void) => {
			this.conn.once('ready', async () =>
				this.localStore.updateCache().then(() => {
					this.props.loaded = true;
					resolve(this)
				}));
				// .catch(reject.bind(this, this.props.address)))

			this.conn.once('error', reject.bind(this, this.props.address));

			this.conn.connect();
		});
	}

	async getConversationListings(): Promise<ConversationListing[]> {
		return await this.localStore.getConversationListings();
	}

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
}
