import Message from './Message';
import Conversation from './Conversation';
import Imap, { ConnectionProperties, Message as RawMessage, MailboxType } from './Imap';

interface Contact {
	name: string;
	addresses: Set<string>;
}

export default class Account {
	private imap: Imap;
	private contacts: Contact[] = [];
	private conversations: Conversation[] = [];

	private name: string;
	private image: string;
	private address: string;
	private unread: boolean;

	constructor(name: string, image: string, connection: ConnectionProperties) {
		this.name = name;
		this.image = image;
		this.address = connection.username;
		this.unread = true;

		this.imap = new Imap(connection);
	}

	async connect() {
		await this.imap.connect();

		const messages = await this.fetchAllMessages();
		this.conversations = this.createConversations(messages).filter(c => c.active);
		this.contacts = this.createContacts(messages);
	}

	getName() {
		return this.name;
	}

	getAddress() {
		return this.address;
	}

	getImage() {
		return this.image;
	}

	hasUnreads() {
		return this.unread;
	}

	getConversations() {
		return this.conversations;
	}

	getContacts() {
		return this.contacts;
	}

	getMessages(_messages: string[]): Message[] {
		return [{
			id: 'AOUEOAEu',
			date: new Date(),
			from: 'me@auri.xyz',
			to: [ 'nicole@aurailus.design' ],
			content: '<p>Lorem ipsum dolor sit amet.</p>'
		}];
	}

	async fetchAllMessages(): Promise<RawMessage[]> {
		const boxes = (await this.imap.listBoxes()).filter(box =>
			!box.treeTypes.has(MailboxType.Spam) && !box.treeTypes.has(MailboxType.Trash));

		let allMeta: RawMessage[] = [];

		for (let box of boxes) {
			await this.imap.openBox(box.path);
			const meta = await this.imap.fetchMessages('1:*');
			Object.keys(meta).forEach(id => allMeta.push(meta[id]));
		}

		allMeta = allMeta.sort((a, b) => +a.date - +b.date);
		return allMeta;
	}

	private createConversations(messages: RawMessage[]): Conversation[] {
		const conversations: Conversation[] = [];

		messages.forEach(message => {
			if (message.replyTo) {
				for (let conversation of conversations) {
					for (let reference of [ ...message.references, message.replyTo ]) {
						if (conversation.messages.has(reference)) {
							conversation.date = message.date;
							conversation.messages.add(message.messageId);
							conversation.title = this.cleanSubjectLine(message.subject);
							conversation.active = conversation.active || message.active;
							message.to.forEach(p => conversation.participants.add(p.address));
							conversation.participants.add(message.from.address);
							return;
						}
					}
				}
			}

			conversations.push({
				title: this.cleanSubjectLine(message.subject),
				messages: new Set([ message.messageId ]),
				date: message.date,
				active: message.active,
				participants: new Set([ message.from.address, ...message.to.map(p => p.address) ])
			});
		});

		conversations.forEach(conversation => {
			conversation.participants.delete(this.address);
		});

		return conversations.sort((a, b) => +a.date - +b.date);
	}

	private createContacts(messages: RawMessage[]): Contact[] {
		const contacts: Contact[] = [];

		for (let message of messages) {
			[ message.from, ...message.to ].forEach(participant => {
				for (let contact of contacts) {
					if (contact.addresses.has(participant.address)) {
						if (participant.name) contact.name = participant.name;
						return;
					}
				}

				contacts.push({
					name: participant.name ?? participant.address,
					addresses: new Set([ participant.address ])
				});
			});
		}

		return contacts;
	}

	private cleanSubjectLine(subject: string = '') {
		return subject.replace(/^((re|fwd?|b?cc)(:| ) *)*/gi, '').trim();
	}
};
