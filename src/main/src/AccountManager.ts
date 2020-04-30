import { WebContents, ipcMain as recv } from 'electron';
import { SerializedAccount } from '../../data/SerializedAccount';
import { ImapAccount } from './ImapAccount';

const fs = require('fs').promises; 

export class AccountManager {
	private send: WebContents;
	private accounts: {[key: string]: ImapAccount} = {};
	currentAccountKey: string = "";

	constructor(send: WebContents) {
		this.send = send;

		recv.on('account-open', 		 (_: Electron.IpcMessageEvent, acctId: string) => this.handleAccountOpen(acctId));
		recv.on('conversation-open', (_: Electron.IpcMessageEvent, convId: number) => this.handleConversationOpen(convId));
	}

	private addAccount(account: ImapAccount) {
		this.send.send('account-add', account.props);
		this.accounts[account.props.address] = account;

		// Temporary to allow faster debugging
		recv.on('reload', () => this.send.send('account-add', account.props));
	}


	private async accountsFromFile(credFile: string): Promise<ImapAccount[]> {
		try {
			let file = await fs.readFile(credFile);
			return JSON.parse(file).accounts.map((o: SerializedAccount) => new ImapAccount(o));
		}
		catch (e) {
			console.error("Encountered an error loading accounts from file:\n" + e + "\nRecreating credentials file.");
			try { await fs.unlink(credFile); } catch (e) {}
			await fs.writeFile(credFile, `{ "accounts": [] }`);
			return [];
		}
	}

	async loadAccounts() {
		let accounts = await this.accountsFromFile('data/cred.json');
		accounts.forEach((a) => this.addAccount(a));

		if (accounts.length == 0) {
			this.send.send('settings', 'account-create');
			// Temporary to allow faster debugging
			recv.on('reload', () => this.send.send('settings', 'account-create'));
			return;
		}

		await Promise.all(Object.keys(this.accounts).map(async (name: string) => {
			const account = this.accounts[name];

			await account.setup();
			await account.connect();

			this.send.send('account-load', account.props);
			if (this.currentAccountKey == name)
				this.send.send('conversation-listings', await account.getChainListings());
		}));
	}

	handleAccountOpen(id: string) {
		for (const address in this.accounts) {
			if (this.accounts[address].props.id === id) { 
				this.currentAccountKey = address;
				break;
			}
		}
		if (!this.currentAccountKey) return;
		this.sendConversationHeaders();
	}

	private async sendConversationHeaders() {
		if (!this.currentAccountKey || !this.accounts[this.currentAccountKey] || 
			!this.accounts[this.currentAccountKey].props.loaded) return;

		this.send.send('conversation-listings', []);
		const listings = await this.accounts[this.currentAccountKey].getChainListings();
		setTimeout(() => this.send.send('conversation-listings', listings), 300);
	}

	async handleConversationOpen(convId: number) {
		if (!this.currentAccountKey || !this.accounts[this.currentAccountKey] ||
			!this.accounts[this.currentAccountKey].props.loaded) return;

		this.send.send('conversation-details',
			await this.accounts[this.currentAccountKey].getChainDetails(convId));
	}
}
