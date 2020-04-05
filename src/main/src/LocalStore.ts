import * as fs from 'fs';
import * as addrs from "email-addresses";

import Crypto from 'crypto';
import Knex from 'knex';

const parseHeader = require('imap').parseHeader;
const simpleParser = require('mailparser').simpleParser;

import { ImapBox } from '../declarations/ImapBox';
import { SQLMessage, SQLBox, SQLConversation, SQLContact, SQLBody } from '../declarations/SQLStructs';

import { ConversationListing, ConversationDetails } from '../../data/Conversation';
import { Message, MessageHeader, MessageBody } from '../../data/Message';

import { ImapPool } from './ImapPool';
import { ImapAccount } from './ImapAccount';

export class LocalStore {
	private static CACHE_STR_LEN: number = 2147483647;

	private account: ImapAccount;
	private conn: ImapPool;
	private db: Knex;

	constructor(account: ImapAccount, conn: ImapPool) {
		this.conn = conn;
		this.account = account;

		// TEMP Delete data on startup
		try { fs.unlinkSync('data/cache/' + this.account.props.address + '.sqlite'); } catch (e) {}

		this.db = Knex({
			client: 'sqlite3',
			searchPath: ['knex', 'public'],
			useNullAsDefault: true,
			connection: { filename: 'data/cache/' + this.account.props.address + '.sqlite' },
		});
	}

	//
	// Set up the LocalStore object.
	// This will create the local database if it doesn't exist.
	// 
	async setup() {
		await this.db.schema.hasTable('boxes').then(async (has) => {
			if (!has) return this.setupDatabase();
			return null;
		});
	}

	//
	// Set up the Knex database from scratch.
	// This should only be run on an empty database - i.e. when creating a new account.
	//
	private async setupDatabase() {
		await this.db.schema.createTable('boxes', table => {
			table.increments();
			table.integer('uidvalidity');

			table.string('name', 64);
			table.string('path');
			table.string('delimiter', 8);
			table.string('attribs');

			table.integer('parent');
			table.json('children');

			table.boolean('useInConversations');
		});

		await this.db.schema.createTable('messages', table => {
			table.increments();
			table.integer('box_id');
			table.integer('conv_id').notNullable().defaultTo(0);

			table.string('subject', 512);
			table.date('date');

			table.json('recipients');
			table.json('senders');

			table.integer('seqno');
			table.integer('uid');
			table.string('hash', 64);
			table.string('reply_to', 64);
		});

		await this.db.schema.createTable('bodies', table => {
			table.integer('id').primary();

			table.string('body', LocalStore.CACHE_STR_LEN);
			table.date('lastAccessed');
		});

		await this.db.schema.createTable('conversations', table => {
			table.increments();

			table.string('topic', 512);
			table.date('date');

			table.json('participants');
		});

		await this.db.schema.createTable('contacts', table => {
			table.increments();

			table.string('name');
			table.string('address');

			table.date('date');
		});
	}

	//
	// Update the entire cache. Pull down all of the box information and messages.
	// This should be made to only update the info, not replace it, but it doesn't yet.
	// Returns how many messages have been pulled down.
	//
	async updateCache(): Promise<number> {
		await this.syncBoxes();

		for (let box of await this.db('boxes').select('path'))
			await this.syncMessages(box.path);

		let emailCount = (await this.db('messages').select('id')).length;

		await this.buildConversations();

		return emailCount;
	}

	//
	// Get conversation listing by Conversation ID,
	// retrieving and parsing the data from the db.
	//
	async getConversationListing(convId: number): Promise<ConversationListing> {
		const rawConv: SQLConversation = 
			(await this.db('conversations').select('*').where('id', '=', convId))[0];

		let conv: ConversationListing = {
			id: rawConv.id!,
			topic: rawConv.topic,

			participants: "",

			lastMessageDate: rawConv.date,
			messageIds: []
		};
			
		conv.participants = (await this.db('contacts').select('name')
			.whereIn('id', JSON.parse(rawConv.participants))).map((row) => row.name).sort().join(", ");
		conv.messageIds = 
			(await this.db('messages').select('id').where('conv_id', '=', rawConv.id)).map((row) => row.id);

		return conv;
	}

	//
	// Get all conversation listings on the account,
	// retrieving and parsing the data from the db.
	//
	async getConversationListings(): Promise<ConversationListing[]> {
		let conversations: ConversationListing[] = [];
		await Promise.all((await this.db('conversations').select('id')).map(async (row) => 
			conversations.push(await this.getConversationListing(row.id))));

		conversations.sort((a, b) => a.lastMessageDate > b.lastMessageDate ? -1 : 1);
		return conversations;
	}

	//
	// Concatenate message header and body details and 
	// return a full Message object that corresponds to the message id.
	//
	async getMessage(messageId: number): Promise<Message> {
		const rawHeader: SQLMessage = (await this.db('messages').select('*').where('id', '=', messageId))[0];
		const header: MessageHeader = {
			id: messageId, 
			date: rawHeader.date, 
			subject: rawHeader.subject, 
			recipients: "", 
			senders: ""
		};

		header.senders = (await this.db('contacts').select('name')
			.whereIn('id', JSON.parse(rawHeader.senders))).map((row) => row.name).sort().join(", ");
		header.recipients = (await this.db('contacts').select('name')
			.whereIn('id', JSON.parse(rawHeader.recipients))).map((row) => row.name).sort().join(", ");

		const rawBody = (await this.db('bodies').select('body').where('id', '=', messageId))[0].body;
		const body: MessageBody = {id: messageId, body: rawBody};

		return {header: header, body: body};
	}

	//
	// Get the full conversation details of a conversation.
	// This includes all of the headers and bodies for the messages included.
	//
	async getConversationDetails(convID: number): Promise<ConversationDetails> {
		let details = (await this.getConversationListing(convID)) as ConversationDetails;
		await this.cacheBodies(details.messageIds.slice());
		details.messages = await Promise.all(details.messageIds.map(async (id) => await this.getMessage(id)));
		details.messages.sort((a, b) => a.header.date < b.header.date ? 1 : -1);
		return details;
	}

	//
	// Get the layout of boxes on the Imap server,
	// and store the information in the `boxes` table in the knex db.
	//
	private async syncBoxes() {
		async function insertBoxes(db: Knex, name: string, box: ImapBox, path?: string, parentId?: number): Promise<{id: number, path: string}> {
			path = (path ? path + box.delimiter + name : name);

			let useInConversations: boolean = 
				name == "INBOX" ||
				box.attribs.includes('\\Sent') || 
				box.attribs.includes('\\Trash');

			let id: number = (await db('boxes').insert({
				name: name,
				path: path,
				delimiter: box.delimiter,
				attribs: box.attribs.join(' '),
				parent: (parentId === undefined ? null : parentId),
				children: JSON.stringify([]),
				useInConversations: useInConversations
			} as SQLBox))[0];

			if (box.children != null) {
				await Promise.all(Object.keys(box.children).map(async (name: string) => {
					let child = box.children![name];
					let dat: {id: number, path: string} = await insertBoxes(db, name, child, path, id);

					await db('boxes').where('id', '=', id).select('children')
					.then((rows: {children: string}[]) => {
						let children: number[] = JSON.parse(rows[0].children) || [];
						children.push(dat.id);

						return db('boxes').where('id', '=', id).update({children: children});
					});
				}));
			}

			return {id: id, path: path};
		}

		const boxes = await this.conn.getBoxList();
		await Promise.all(Object.keys(boxes).map(async (name: string) => {
			let box = boxes[name];
			await insertBoxes(this.db, name, box);
		}));
	}

	//
	// Get the ID of a contact from their address, and update
	// their name if the passed-in name is newer than the one on-file.
	//
	private async updateContact(address: string, name: string, date: number): Promise<number> {
		let data: {id: number, date: number} = 
			(await this.db('contacts').select(['id', 'date']).where('address', '=', address))[0];

		if (data == undefined) {
			return (await this.db('contacts').insert({
				name: (name == "" ? address : name),
				address: address,
				date: date
			} as SQLContact))[0];
		}
		else if (date > data.date && name != "") {
			await this.db('contacts').where('id', '=', data.id).update({name: name, date: date});
		}
		
		return data.id;
	}

	//
	// Parse through a to or from header, add the contacts to the contacts db,
	// and return an ordered array of contact ids.
	//
	private async parseContactHeader(header: string, date: number): Promise<number[]> {
		let participants: addrs.ParsedMailbox[] = addrs.parseFrom(header) as addrs.ParsedMailbox[];

		let ids: number[] = [];
		if (participants == null) return ids;
		for (let p of participants) ids.push(await this.updateContact(p.address || "", p.name || "", date));

		//@ts-ignore - remove duplicates.
		ids = [...new Set(ids)];
		ids.sort();
		return ids;
	}

	//
	// Get all of the email headers from a specified box on the Imap server,
	// and store the information in the `messages` table in the knex db.
	//
	private async syncMessages(boxPath: string) {

		// await this.db('boxes').where('id', '=', id)
		// 	.update({uidvalidity: boxProps.uidvalidity});

		const id = (await this.db('boxes').where('path', '=', boxPath).select('id'))[0].id;
		const addSeqNos = await this.conn.box(boxPath).seqSearch(['ALL']);

		// Early return if the box is empty.
		if (!addSeqNos || addSeqNos.length == 0) return;
			
		let content: SQLMessage[] = [];
		let promises: Promise<void>[] = [];

		await this.conn.box(boxPath).seqFetch(addSeqNos, 
			{ bodies: "HEADER"}, (msg: any, seqno: number) => {
			
			let header: any;
			let uid: number = 0;

			msg.on('body', function(stream: any) {
				let buffer = "";
				stream.on('data', (chunk: any) => buffer += chunk.toString('utf8'));
				stream.once('end', () => header = parseHeader(buffer));
			});

			msg.on('attributes', (a: any) => uid = a.uid);

			msg.once('end', () => {
				promises.push((async () => {
					let date = Date.parse(header.date.join(''));

					const recipientData = await this.parseContactHeader((header.to || []).join(', '), date);
					const senderData = await this.parseContactHeader((header.from || []).join(', '), date);

					let message: SQLMessage = {
						box_id: id,
						conv_id: 0,

						subject: (header.subject || []).join(''),
						date: date,
						
						senders: JSON.stringify(senderData),
						recipients: JSON.stringify(recipientData),

						seqno: seqno,
						uid: uid,
						hash: Crypto.createHash('sha256', (header['message-id'] || []).join('')).toString();
					}

					const replyTo = (header['in-reply-to'] || []).join('');
					if (replyTo != '') message.reply_to = Crypto.createHash('sha256', replyTo).toString();

					content.push(message);
				})());
			});
		});

		await Promise.all(promises);

		// Break the upload into chunks to avoid overloading the DB.
		const CHUNK_SIZE = 50;
		for (let i = 0; i < Math.ceil(content.length / CHUNK_SIZE); i++) {
			await this.db('messages').insert(content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
		}
	}

	//
	// Associate emails into conversations.
	// Scan the inbox, and then check for associated emails in all boxes that have useInConversations enabled.
	// Store the results into the `messages` table in the db.
	//
	private async buildConversations() {
		const inboxId: number = (await this.db('boxes').first('id').where('name', '=', 'INBOX')).id;

		const convBoxes: number[] = (await this.db('boxes').select('id')
			.where('useInConversations', '=', true)).map((row) => row.id);

			const baseEmails: string[] = (await this.db('messages').distinct('senders')
			.where('box_id', '=', inboxId).select('senders')).map((row) => row.senders);

		await Promise.all(baseEmails.map(async (participants: string) => {
			let chain: SQLMessage[] = [];

			(await this.db('messages').select(['box_id', 'id', 'date', 'subject']).whereIn('box_id', convBoxes)
				.andWhere(function() { this.where('senders', '=', participants).orWhere('recipients', '=', participants); }))
				.map((row) => chain.push(row));

			chain.sort((a, b) => a.date < b.date ? -1 : 1);

			let topic = chain[chain.length - 1].subject;
			if (/<?No subject>?/gi.test(topic) || topic == "") topic = "No Topic";

			topic = topic
				.replace(/^((re|fwd|fw)[: ]+)+/gi, "")					 // Remove junk at the start of the topic.
				.replace(/^\w/, (c: string) => c.toUpperCase()); // Title case the string.

			const conv_id = (await this.db('conversations').insert({
				topic: topic,
				date: chain[chain.length - 1].date,
				participants: participants
			} as SQLConversation))[0];

			const ids = chain.map((elem: SQLMessage) => elem.id);
			await this.db('messages').whereIn('id', ids).update("conv_id", conv_id);
		}));
	}

	//
	// Get the bodies of the list of messages below from the DB,
	// and either add them to the cache, or, if they already exist in there, 
	// update their lastAccessed value.
	//
	private async cacheBodies(dbIds: number[]) {
		const duplicateIDs = (await this.db('bodies').select('id').whereIn('id', dbIds)).map((row) => row.id);
		for (let id of duplicateIDs) dbIds.splice(dbIds.indexOf(id), 1);

		let messages: {id: number, uid: number, box_id: number}[] = 
			await this.db('messages').whereIn('id', dbIds).select(['id', 'uid', 'box_id']);
			
		let parsePromises: Promise<{data: any, uid: number}>[] = [];

		let retrieveBodies = async (messages: {id: number, uid: number, box_id: number}[]) => {
			if (messages.length == 0) return;
			const boxPath: string = (await this.db('boxes').where('id', '=', messages[0].box_id).select('path'))[0].path;
			

			await this.conn.box(boxPath).uidFetch(messages.map((r) => r.uid), { bodies: "", struct: true }, (msg: any, _seqno: number) => {
				let body: string = "";
				let uid: number = -1;
				
				msg.on('body', function(stream: any) {
					let buffer = "";
					stream.on('data', (chunk: any) => buffer += chunk.toString('utf8'));
					stream.once('end', () => body = buffer);
				});

				msg.on('attributes', (a: any) => uid = a.uid);
				
				msg.once('end', () => {
					parsePromises.push(new Promise(async (resolve: (ret: {data: any, uid: number}) => void) => {
						resolve({data: await simpleParser(body, {}), uid: uid});
					}));
				});
			});
		}

		messages.sort((a, b) => a.box_id < b.box_id ? 1 : -1);

		let startInd = 0;
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].box_id != messages[startInd].box_id) {
				await retrieveBodies(messages.slice(startInd, i));
				startInd = i;
			}
		}
		await retrieveBodies(messages.slice(startInd));

		for (let ans of await Promise.all(parsePromises)) {
			let id = -1;
			for (let message of messages) {
				if (message.uid == ans.uid) {
					id = message.id;
					break;
				}
			}
			if (id == -1) throw "Failed to find message in messages queue.";
			if ((await this.db('bodies').select('id').where('id', '=', id)).length == 0) {
				await this.db('bodies').insert({
					id: id,
					body: ans.data.html || ans.data.textAsHtml,
					lastAccessed: Date.now()
				} as SQLBody);
			}
		}
	}
}
