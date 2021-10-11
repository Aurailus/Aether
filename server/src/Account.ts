import Imap from 'imap';
import { ObjectID } from 'mongodb'

// import Message from './Message';
// import Conversation from './Conversation';
import Log from './Log';
import * as DB from './data/Data';
import ImapController from './imap/ImapController';

// interface Contact {
// 	name: string;
// 	addresses: Set<string>;
// }

export default class Account {
	private address: string;
	private accountID: ObjectID;
	private conn: ImapController;
	// private contacts: Contact[] = [];
	// private conversations: Conversation[] = [];

	constructor(data: DB.Account) {
		this.accountID = data._id;
		this.address = data.address;
		Log.info('Created account %s', data.address);

		this.conn = new ImapController({
			user: data.address,
			password: data.password,
			host: data.host,
			port: data.port,
			tls: data.tls
		});
	}

	async init() {
		await this.conn.connect();

		Log.perfStart('Synchronizing ' + this.address);
		const remoteBoxes = await this.getBoxes();
		await this.synchronizeBoxes(remoteBoxes);
		await this.synchronizeMessages(remoteBoxes);
		Log.perfEnd('Synchronizing ' + this.address);


		// Log.info('Connected to %s', this.data.address);
		// await this.synchronizeData();
		// Log.perfEnd('Synchronizing ' + this.data.address);

		// const messages = await this.fetchAllMessages();
		// this.conversations = this.createConversations(messages).filter(c => c.active);
		// this.contacts = this.createContacts(messages);
	}

	async synchronizeBoxes(remoteBoxes: Map<string, Imap.Box>): Promise<void> {
		const currentBoxes = await DB.MailboxModel.find({ account: this.accountID });
		await Promise.all([ ...remoteBoxes.values() ].map(async box => {
			const existing = currentBoxes.filter(b => b.path === box.name)[0];
			if (!existing) await this.addNewBox(box);
			else await this.refreshExistingBox(box, existing);
		}));
	}

	private async addNewBox(box: Imap.Box) {
		await DB.MailboxModel.create({
			account: this.accountID,
			name: box.name, // TODO: This
			path: box.name,
			delimiter: '.', // TODO: and this
			type: DB.MailboxType.Inbox,
			treeTypes: new Set([ DB.MailboxType.Inbox ]),
			parent: undefined, // and this
			uidValidity: box.uidvalidity,
			uidNext: 1,
		} as DB.Create<DB.Mailbox>);
	}

	private async refreshExistingBox(remote: Imap.Box, _existing: DB.Mailbox) {
		Log.debug('existing box ' + remote.name);
	}

	async synchronizeMessages(remoteBoxes: Map<string, Imap.Box>): Promise<void> {
		const currentBoxes = await DB.MailboxModel.find({ account: this.accountID });
		await Promise.all(currentBoxes.map(async box => {
			const remote = remoteBoxes.get(box.path)!;
			console.log(box.uidNext, remote.uidnext);
			// if (box.uidValidity !== remote.uidvalidity) {
			// 	// Reacquire existing messages
			// }
			if (box.uidNext !== remote.uidnext) {
				// Get new messages
				const messages = await (await this.conn.get(box.path)).fetchMessagesByUID(`${box.uidNext}:*`);
				await DB.MailboxModel.updateOne({ _id: box._id }, { uidNext: remote.uidnext });
				if (messages.size > 0) {
					console.log('adding ' + messages.size + ' messages.');
					await DB.MessageModel.insertMany([ ...messages.keys() ].map(uid => {
						const message = messages.get(uid)!;
						const headers = this.parseHeaders(message.headers);
						return {
							account: this.accountID,
							box: box._id,
							uid: uid,
							messageId: headers.get('MESSAGE-ID') ?? '[!DATE:' + (+message.attrs.date) + ']',
							subject: this.cleanSubject(headers.get('SUBJECT')),
							date: message.attrs.date,
						} as DB.Message;
					}));
				}
			}
		}));
	}

	private async getBoxes(): Promise<Map<string, Imap.Box>> {
		Log.perfStart('Getting boxes for ' + this.address);

		const remoteBoxes = await (await this.conn.get()).getBoxes();
		const boxReqs: Promise<void>[] = [];
		const boxes: Map<string, Imap.Box> = new Map();

		const reqBoxesRecursively = (tree: Imap.MailBoxes, path: string = '') => {
			Object.keys(tree).forEach(name => {
				boxReqs.push((async () => {
					const box = (await this.conn.get(path + name)).getOpenBoxProps();
					boxes.set(path + name, box);
				})());
				if (tree[name].children) reqBoxesRecursively(tree[name].children,
					path + name + tree[name].delimiter);
			});
		}

		reqBoxesRecursively(remoteBoxes);
		await Promise.all(boxReqs);

		Log.perfEnd('Getting boxes for ' + this.address);
		return boxes;
	}

	private parseHeaders(rawHeaders: string): Map<string, string> {
		const headers: Map<string, string> = new Map();
		rawHeaders
		.split(/\r?\n(?=[A-z:\-_]+)/g)
		.map(h => h.trim())
		.filter(h => h)
		.forEach(h => {
			const delimiter = h.indexOf(':');
			const name = h.substr(0, delimiter).trim();
			const value = h.substr(delimiter + 1).trim();
			headers.set(name.toUpperCase(), value);
		});
		return headers;
	}

	private cleanSubject(subject: string = '') {
		return subject.replace(/^((re|fwd?|b?cc)(:| ) *)*/gi, '').trim();
	}

	// async synchronizeData(): Promise<void> {
	// 	const existingBoxes = await DB.MailboxModel.find({ account: this.data._id });
	// 	const remoteBoxes = (await this.imap.listBoxes());

	// 	const newBoxes: (Mailbox & { uidValidity: number })[] = [];
	// 	const boxValidityChanged: { _id: ObjectID, uidValidity: number }[] = [];
	// 	const removedBoxes: Set<ObjectID> = new Set(existingBoxes.map(box => box._id));

	// 	for (let remote of remoteBoxes) {
	// 		if (!remote.treeTypes.has(DB.MailboxType.Inbox) &&
	// 				!remote.treeTypes.has(DB.MailboxType.Sent) &&
	// 				!remote.treeTypes.has(DB.MailboxType.Archives)) continue;

	// 		const existing = existingBoxes.filter(box => box.path === remote.path)[0];
	// 		let uidValidity = (await this.imap.openBox(remote.path)).uidvalidity;
	// 		// Log.debug('Opened %s', remote.path);
	// 		if (!existing) newBoxes.push({ ...remote, uidValidity });
	// 		else {
	// 			removedBoxes.delete(existing._id);
	// 			if (existing.uidValidity != uidValidity) boxValidityChanged.push({ _id: existing._id, uidValidity });
	// 		}
	// 	};

	// 	let createdIDs: Map<string, ObjectID> = new Map();

	// 	for (let box of newBoxes) {
	// 		createdIDs.set(box.path, (await DB.MailboxModel.create({
	// 			name: box.name,
	// 			path: box.path,
	// 			account: this.data._id,
	// 			delimiter: box.delimiter,
	// 			type: box.type,
	// 			treeTypes: box.treeTypes,
	// 			parent: (await DB.MailboxModel.findOne({ path: box.parent }))?._id,
	// 			uidValidity: box.uidValidity,
	// 			uidNext: 1,
	// 		} as DB.Create<DB.Mailbox>)).id);
	// 	}

	// 	await Promise.all(boxValidityChanged.map(({ _id, uidValidity }) =>
	// 		DB.MailboxModel.updateOne({ _id }, { uidValidity, uidNext: 1 })));

	// 	await DB.MailboxModel.deleteMany({ _id: { $in: [ ...removedBoxes ] } });

	// 	for (let box of await DB.MailboxModel.find({ account: this.data._id })) {
	// 		await this.imap.openBox(box.path);
	// 		const meta = Object.values(await this.imap.fetchMessages(box.uidNext + ':*'));

	// 		const contacts: { name: string; addresses: Set<string> }[] = [];

	// 		for (let m of meta) {
	// 			[ m.from, ...m.to ].forEach(participant => {
	// 				for (let contact of contacts) {
	// 					if (contact.addresses.has(participant.address)) {
	// 						if (participant.name) contact.name = participant.name;
	// 						return;
	// 					}
	// 				}

	// 				contacts.push({
	// 					name: participant.name ?? participant.address,
	// 					addresses: new Set([ participant.address ])
	// 				});
	// 			});
	// 		}

	// 		await Promise.all(contacts.map(async contact => {
	// 			const addresses = [ ...contact.addresses ];
	// 			await DB.ContactModel.updateOne(
	// 				{ addresses: { $elemMatch: { $in: addresses } as any } },
	// 				{
	// 					$set: { name: contact.name },
	// 					$addToSet: { addresses }
	// 				},
	// 				{ upsert: true });
	// 		}));

	// 		await Promise.all(meta.map(async meta => {
	// 			await DB.MessageModel.updateOne({ messageId: meta.messageId }, {
	// 				box: box._id,
	// 				uid: meta.boxId,
	// 				account: this.data._id,
	// 				$setOnInsert: {
	// 					subject: meta.subject,
	// 					date: meta.date,
	// 					from: (await DB.ContactModel.findOne({ addresses: meta.from.address }))!._id
	// 				}
	// 			} as any as DB.Message,
	// 			{ upsert: true });
	// 		}));

	// 		// await DB.MessageIDModel.insertMany(Object.values(meta).map(meta =>
	// 		// 	({ messageId: meta.messageId, uid: meta.boxId, account: this.data._id, box: box._id })));
	// 	}

		// const boxes = (await this.imap.listBoxes()).filter(box =>
		// 	!box.treeTypes.has(MailboxType.Spam) && !box.treeTypes.has(MailboxType.Trash));

		// let allMeta: RawMessage[] = [];

		// for (let box of boxes) {
		// 	await this.imap.openBox(box.path);
		// 	const meta = await this.imap.fetchMessages('1:*');
		// 	Object.keys(meta).forEach(id => allMeta.push(meta[id]));
		// }
	// }

	// getName() {
	// 	return this.name;
	// }

	// getAddress() {
	// 	return this.address;
	// }

	// getImage() {
	// 	return this.image;
	// }

	// hasUnreads() {
	// 	return this.unread;
	// }

	// getConversations() {
	// 	return this.conversations;
	// }

	// getContacts() {
	// 	return this.contacts;
	// }

	// getMessages(_messages: string[]): Message[] {
	// 	return [{
	// 		id: 'AOUEOAEu',
	// 		date: new Date(),
	// 		from: 'me@auri.xyz',
	// 		to: [ 'nicole@aurailus.design' ],
	// 		content: '<p>Lorem ipsum dolor sit amet.</p>'
	// 	}];
	// }

	// async fetchAllMessages(): Promise<RawMessage[]> {
	// 	const boxes = (await this.imap.listBoxes()).filter(box =>
	// 		!box.treeTypes.has(MailboxType.Spam) && !box.treeTypes.has(MailboxType.Trash));

	// 	let allMeta: RawMessage[] = [];

	// 	for (let box of boxes) {
	// 		await this.imap.openBox(box.path);
	// 		const meta = await this.imap.fetchMessages('1:*');
	// 		Object.keys(meta).forEach(id => allMeta.push(meta[id]));
	// 	}

	// 	allMeta = allMeta.sort((a, b) => +a.date - +b.date);
	// 	return allMeta;
	// }

	// private createConversations(messages: RawMessage[]): Conversation[] {
	// 	const conversations: Conversation[] = [];

	// 	messages.forEach(message => {
	// 		if (message.replyTo) {
	// 			for (let conversation of conversations) {
	// 				for (let reference of [ ...message.references, message.replyTo ]) {
	// 					if (conversation.messages.has(reference)) {
	// 						conversation.date = message.date;
	// 						conversation.messages.add(message.messageId);
	// 						conversation.title = this.cleanSubjectLine(message.subject);
	// 						conversation.active = conversation.active || message.active;
	// 						message.to.forEach(p => conversation.participants.add(p.address));
	// 						conversation.participants.add(message.from.address);
	// 						return;
	// 					}
	// 				}
	// 			}
	// 		}

	// 		conversations.push({
	// 			title: this.cleanSubjectLine(message.subject),
	// 			messages: new Set([ message.messageId ]),
	// 			date: message.date,
	// 			active: message.active,
	// 			participants: new Set([ message.from.address, ...message.to.map(p => p.address) ])
	// 		});
	// 	});

	// 	conversations.forEach(conversation => {
	// 		conversation.participants.delete(this.address);
	// 	});

	// 	return conversations.sort((a, b) => +a.date - +b.date);
	// }

	// private createContacts(messages: RawMessage[]): Contact[] {
	// 	const contacts: Contact[] = [];

	// 	for (let message of messages) {
	// 		[ message.from, ...message.to ].forEach(participant => {
	// 			for (let contact of contacts) {
	// 				if (contact.addresses.has(participant.address)) {
	// 					if (participant.name) contact.name = participant.name;
	// 					return;
	// 				}
	// 			}

	// 			contacts.push({
	// 				name: participant.name ?? participant.address,
	// 				addresses: new Set([ participant.address ])
	// 			});
	// 		});
	// 	}

	// 	return contacts;
	// }

};
