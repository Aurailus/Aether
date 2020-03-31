import * as Electron from 'electron';
const fs = require('fs').promises; 

import { ImapAccount } from './ImapAccount';
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
		let data: string = await fs.readFile('data/cred.json')
		for (const serialized of JSON.parse(data).accounts) {
			const acct = new ImapAccount(serialized);
			this.manager.addAccount(acct);
		}

		try { await this.manager.loadAccounts(); }
		catch (failedAcct) { console.log('Failed to connect to account ', failedAcct); }
	}
}
