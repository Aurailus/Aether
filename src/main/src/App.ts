const Imap = require('imap');
const fs = require('fs').promises;
const { ipcMain } = require('electron');

import { SerializedAccount } from '../../data/SerializedAccount';
import { ImapConnection } from '../../data/ImapConnection';
import { ImapBox } from '../../data/ImapBox';
import { MessageHeader } from '../../data/MessageHeader';

export class App {
	window: Electron.BrowserWindow;
	connections: ImapConnection[] = [];
	currentConn: ImapConnection | null = null;

	constructor(window: Electron.BrowserWindow) {
		this.window = window;

		this.connectToAccounts();

		ipcMain.on('account-open', (event: Electron.IpcMessageEvent, acctId: string) =>
			this.handleAccountOpen(acctId)
		);
	}

	handleAccountOpen(id: string) {
		for (const conn of this.connections) {
			if (conn.props.id === id) { this.currentConn = conn; break; }
		}
		if (!this.currentConn) return;

		this.sendBoxes();
		this.sendConversations();
	}
	
	sendBoxes() {
		this.currentConn!.getAllBoxes().then((boxes: { [key: string]: ImapBox }) => {
			this.window.webContents.send('account-boxes', boxes);
		}).catch((err: string) => {
			console.log('Error getting boxes: ', err);
		});
	}

	imapConnected(connection: ImapConnection) {
		this.connections.push(connection);
		this.window.webContents.send('account-add', connection.props);

		// Temporary to allow faster debugging
		ipcMain.on('reload', () => this.window.webContents.send('account-add', connection.props));
	}

	sendConversations() {
		let messageHeaders: MessageHeader[] = [];

		this.currentConn!.openBox('INBOX').then((box: any) => {
			return this.currentConn!.getMessageUIDs();
		}).then((res: number[]) => {
			return this.currentConn!.getMessageHeaders(res, (header: any, attrs: any) => {
				messageHeaders.push({
				  to: header.to,
				  from: header.from,
				  subject: header.subject,
				  date: header.date,
				  uid: attrs.uid
				});
			});
		}).then(() => {
			this.window.webContents.send('conversations', messageHeaders);
		}).catch((err: string) => {
			console.log('Error getting messages: ', err);
		});
	}

	connectToAccounts() {
		fs.readFile('data/cred.json').then((data: string) => {
			try {
				const serializedAccts: SerializedAccount[] = JSON.parse(data).accounts;

				for (const serializedAcct of serializedAccts) {
					const account = new ImapConnection(serializedAcct);

					account.connect().then(() => {
						this.imapConnected(account);
					})
					.catch((failed: string) => {
						console.log('Failed to log in to', failed);
					});
				}
			} catch (e) {
				console.error('Failed to parse cred.json.');
				process.exit(1);
			}
		});
	}
}
