const Imap = require('imap');
const fs = require('fs').promises;

import { ImapAccount } from './ImapAccount';
import { SerializedAccount } from '../../data/SerializedAccount';
import { AccountManager } from './AccountManager';

export class App {
	window: Electron.BrowserWindow;
	manager: AccountManager;

	constructor(window: Electron.BrowserWindow) {
		this.window = window;
		this.manager = new AccountManager(this.window.webContents);
			
		this.initialize();
	}

	async initialize() {
		await this.loadAccounts();
	}

	private async loadAccounts() {
		let data: string = await fs.readFile('data/cred.json');
		const serializedAccounts: SerializedAccount[] = JSON.parse(data).accounts;

		for (const serialized of serializedAccounts) {
			const acct = new ImapAccount(serialized);
			acct.connect().then(async () => {
				await this.manager.loadAccount(acct);
			})
			.catch((failedAcct: string) => {
				console.log('Failed to connect to', failedAcct);
			});
		}
	}
}
