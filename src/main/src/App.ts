const Imap = require('imap');
const fs = require('fs').promises;
const { ipcMain } = require('electron');
import { simpleParser } from 'mailparser'


// const simpleParser = require('mailparser-mit').simpleParser;
// console.log('printing stuff', simpleParser);

import { ImapBox } from '../../data/ImapBox';
import { ImapConnection } from '../../data/ImapConnection';
import { SerializedAccount } from '../../data/SerializedAccount';
import { MessageHeader } from '../../data/MessageHeader';
import { MessageConversation } from '../../data/MessageConversation';

export class App {
	window: Electron.BrowserWindow;
	connections: ImapConnection[] = [];
	currentConn: ImapConnection | null = null;

	constructor(window: Electron.BrowserWindow) {
		this.window = window;

		this.connectToAccounts();

		ipcMain.on('account-open', (event: Electron.IpcMessageEvent, acctId: string) => this.handleAccountOpen(acctId));
		ipcMain.on('conversation-open', (event: Electron.IpcMessageEvent, conversationHeaders: MessageConversation) =>this.handleConversationOpen(conversationHeaders));
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

	handleAccountOpen(id: string) {
		for (const conn of this.connections) {
			if (conn.props.id === id) { 
				this.currentConn = conn; break; 
			}
		}
		if (!this.currentConn) return;

		this.sendConversationHeaders();
	}
	
	// sendBoxes() {
	// 	this.currentConn!.getAllBoxes().then((boxes: { [key: string]: ImapBox }) => {
	// 		this.window.webContents.send('account-boxes', boxes);
	// 	}).catch((err: string) => {
	// 		console.log('Error getting boxes: ', err);
	// 	});
	// }

	imapConnected(connection: ImapConnection) {
		this.connections.push(connection);
		this.window.webContents.send('account-add', connection.props);

		// Temporary to allow faster debugging
		ipcMain.on('reload', () => this.window.webContents.send('account-add', connection.props));
	}

	async sendConversationHeaders() {
		this.window.webContents.send('conversations', []);

		try {
			const conversations = await this.collectConversationHeaders();
			if (conversations) this.window.webContents.send('conversations', conversations);
		}
		catch(e) {
			console.log('Error getting messages: ', e);
		}
	}

	async collectConversationHeaders() : Promise<MessageConversation[]> {
		let inboxHeaders: MessageHeader[] = [];
		let conversations: MessageConversation[] = [];
			
		await this.currentConn!.openBox('INBOX');
		let uids: number[] = await this.currentConn!.getMessageUIDs();

		if (this.currentConn!.getBox() != 'INBOX') return null as any;

		await this.currentConn!.getMessageHeaders(uids, (rawHeader: any, attrs: any) => {
			let header = this.processHeader(rawHeader, attrs);
			inboxHeaders.push(header);

			let foundConvo = false;
			for (let conversation of conversations) {
				if (conversation.headers[0].from == header.from) {
					conversation.headers.push(header);
					foundConvo = true;
					break;
				}
			}
			if (!foundConvo) conversations.push({headers: [header], contents: []});
		});

		if (this.currentConn!.getBox() != 'INBOX') return null as any;

		await this.currentConn!.openBox('Trash');
		uids = await this.currentConn!.getMessageUIDs();

		if (this.currentConn!.getBox() != 'Trash') return null as any;

		await this.currentConn!.getMessageHeaders(uids, (rawHeader: any, attrs: any) => {
			let header = this.processHeader(rawHeader, attrs);

			for (let conversation of conversations) {
				if (conversation.headers[0].from == header.from) {
					conversation.headers.push(header);
					break;
				}
			}
		});

		if (this.currentConn!.getBox() != 'Trash') return null as any;
		
		for (let conversation of conversations) {
			conversation.headers.sort((h1: MessageHeader, h2: MessageHeader): number => {
				return h2.date - h1.date;
			});
		}
		conversations.sort((c1: MessageConversation, c2: MessageConversation): number => {
			return c2.headers[0].date - c1.headers[0].date;
		});

		return conversations;
	}

	processHeader(rawHeader: any, attrs: any): MessageHeader {
		let toName = (rawHeader.to ? rawHeader.to.join() : "");

		let fromName = (rawHeader.from ? rawHeader.from.join() : "");
		let endIndex = (Math.max(fromName.indexOf("<"), 0) || fromName.length);
		fromName = fromName.substr(0, endIndex).replace(/([\"\'])+/g, "");

		let date = Date.parse(rawHeader.date.join(""));

		let topic = (rawHeader.subject ? rawHeader.subject.join() : "No Topic");
		topic = topic.replace(/^([Rr][Ee][: ]+)+/g, "");

		return {
		  to: toName,
		  from: fromName,
		  subject: topic,
		  date: date,

		  uid: attrs.uid,
		  box: this.currentConn!.getBox()
		};
	}

	async handleConversationOpen(conversationHeaders: MessageConversation) {
		this.window.webContents.send('conversation-bodies', conversationHeaders);

		try {
			await this.collectConversationBodies(conversationHeaders);
			this.window.webContents.send('conversation-bodies', conversationHeaders);
		}
		catch(e) {
			console.log('Error getting conversation bodies: ', e);
		}
	}

	async collectConversationBodies(conversation: MessageConversation) : Promise<void> {
		for (let i = 0; i < conversation.headers.length; i++) conversation.contents.push({ body: "", uid: -1 });
		
		let box: string = "";

		// Collect all of the raw bodies for the messages.

		while(true) {
			for (let i = 0; i < conversation.headers.length; i++) {
				if (conversation.contents[i].uid == -1) {
					box = conversation.headers[i].box;
					break;
				}
			}

			if (box == "") break;

			let uids: number[] = [];

			for (let i = 0; i < conversation.headers.length; i++) {
				if (conversation.headers[i].box == box) {
					conversation.contents[i].uid = conversation.headers[i].uid;
					uids.push(conversation.headers[i].uid);
				}
			}

			await this.currentConn!.openBox(box);
			await this.currentConn!.getMessageContents(uids, (content: any, attrs: any) => {
				for (let i = 0; i < conversation.contents.length; i++) {
					if (conversation.contents[i].uid == attrs.uid) {
						conversation.contents[i].body = content;
					}
				}
			});

			box = "";
		}

		// Parse through all of the bodies asynchronously.

		let promises: any[] = [];
		for (let ind in conversation.contents) {
			promises.push(new Promise(async (resolve: (ret: any[]) => void, reject: () => void) => {
				resolve([await simpleParser(conversation.contents[ind].body, {}), ind]);
			}));
		}

		for (let ans of await Promise.all(promises)) {
			conversation.contents[ans[1]].body = ans[0];
		}

		return;
	}
}
