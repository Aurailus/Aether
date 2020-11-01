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
			address: props.email,
			
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
}
