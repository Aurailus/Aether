import { WebContents, ipcMain as recv } from 'electron';
import { ImapAccount } from './ImapAccount';

export class AccountManager {
	private send: WebContents;
	private accounts: {[key: string]: ImapAccount} = {};
	currentAccountKey: string = "";

	constructor(send: WebContents) {
		this.send = send;

		recv.on('account-open', (_event: Electron.IpcMessageEvent, acctId: string) => this.handleAccountOpen(acctId));
		// recv.on('conversation-open', (event: Electron.IpcMessageEvent, conversationHeaders: MessageConversation) 
		// 	=> this.handleConversationOpen(conversationHeaders));
	}

	addAccount(account: ImapAccount) {
		this.send.send('account-add', account.props);
		this.accounts[account.props.address] = account;

		// Temporary to allow faster debugging
		recv.on('reload', () => this.send.send('account-add', account.props));
	}

	async loadAccounts() {
		await Promise.all(Object.keys(this.accounts).map(async (name: string) => {
			const account = this.accounts[name];

			await account.setup();
			await account.connect();

			this.send.send('account-load', account.props);
			if (this.currentAccountKey == name)
				this.send.send('conversation-listings', await account.getConversationListings());
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

	async sendConversationHeaders() {
		if (!this.currentAccountKey || !this.accounts[this.currentAccountKey] || 
			!this.accounts[this.currentAccountKey].props.loaded) return;

		this.send.send('conversation-listings', []);

		const listings = await this.accounts[this.currentAccountKey].getConversationListings();

		setTimeout(() => this.send.send('conversation-listings', listings), 300);
	}

	// async collectConversationBodies(conversation: MessageConversation) : Promise<void> {
	// 	for (let i = 0; i < conversation.headers.length; i++) conversation.contents.push({ body: "", uid: -1 });
		
	// 	let box: string = "";

	// 	// Collect all of the raw bodies for the messages.

	// 	while(true) {
	// 		for (let i = 0; i < conversation.headers.length; i++) {
	// 			if (conversation.contents[i].uid == -1) {
	// 				box = conversation.headers[i].box;
	// 				break;
	// 			}
	// 		}

	// 		if (box == "") break;

	// 		let uids: number[] = [];

	// 		for (let i = 0; i < conversation.headers.length; i++) {
	// 			if (conversation.headers[i].box == box) {
	// 				conversation.contents[i].uid = conversation.headers[i].uid;
	// 				uids.push(conversation.headers[i].uid);
	// 			}
	// 		}

	// 		await this.currentConn!.openBox(box);
	// 		await this.currentConn!.getMessageContents(uids, (content: any, attrs: any) => {
	// 			for (let i = 0; i < conversation.contents.length; i++) {
	// 				if (conversation.contents[i].uid == attrs.uid) {
	// 					conversation.contents[i].body = content;
	// 				}
	// 			}
	// 		});

	// 		box = "";
	// 	}

	// 	// Parse through all of the bodies asynchronously.

	// 	let promises: any[] = [];
	// 	for (let ind in conversation.contents) {
	// 		promises.push(new Promise(async (resolve: (ret: any[]) => void, reject: () => void) => {
	// 			resolve([await simpleParser(conversation.contents[ind].body, {}), ind]);
	// 		}));
	// 	}

	// 	for (let ans of await Promise.all(promises)) {
	// 		conversation.contents[ans[1]].body = ans[0];
	// 	}

	// 	// Strip introductions regex: /(^(Hey|Hello|Hi) *(there|everyone|everybody|guys|gals|girls|dudes|people|friends|NAMES)*[\.,:]*[\n\s]+)/gim
	// 	// Strip signatures regex: /[\n\s]+(thanks|thank you)+.*/gims
	// 	// Strip conversation history regex: /(From:|On)[ \w]+([\[<].+[\]>]|\d{2,4}-\d{2,4}-\d{2,4}|[ \w,\.]{1,10}\d{2,4}).*/gims
	// 	return;
	// }
}
