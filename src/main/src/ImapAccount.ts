import { ImapPool } from './ImapPool';

import { AccountProps } from '../../data/AccountProps';
import { SerializedAccount } from '../../data/SerializedAccount';
import { ChainListing, ChainDetails } from '../../data/Chains';

import { LocalStore } from './LocalStore';

export class ImapAccount {
	readonly props: AccountProps;

	private localStore: LocalStore;
	private conn: ImapPool;

	constructor(props: SerializedAccount) {
		this.props = {
			id: props.id,
			address: props.address,
			
			name: props.label,
			image: props.pfp,

			loaded: false,
			hasUnread: false
		}
		
		this.conn = new ImapPool(props);
		this.localStore = new LocalStore(this, this.conn);
	}

	async setup() {
		await this.localStore.setup();
	}

	async connect() {
		await this.conn.connect();
		await this.localStore.updateCache();
		this.props.loaded = true;
	}

	async getChainListings(): Promise<ChainListing[]> {
		return await this.localStore.getChainListings();
	}

	async getChainDetails(chainID: number): Promise<ChainDetails> {
		return this.localStore.getChainDetails(chainID);
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
