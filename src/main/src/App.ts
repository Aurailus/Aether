import * as Electron from 'electron';

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
		console.log('\n---------------------');
		console.log('     Aether Mail\n     Node Server');
		console.log('---------------------\n');
		
		await this.manager.loadAccounts();
	}
}
