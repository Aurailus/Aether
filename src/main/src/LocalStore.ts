import * as fs from 'fs';
import * as addrs from "email-addresses";

import Crypto from 'crypto';
import Knex from 'knex';

const parseHeader = require('imap').parseHeader;
const simpleParser = require('mailparser').simpleParser;

import { ImapBox } from '../declarations/ImapBox';
import { SQLMessage, SQLBox, SQLChain, SQLContact, SQLBody } from '../declarations/SQLStructs';

import { ChainListing, ChainDetails } from '../../data/Chains';
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

			table.boolean('current').defaultTo('false');
		});

		await this.db.schema.createTable('messages', table => {
			table.increments();
			table.integer('box');
			table.integer('chain').defaultTo(0);

			table.string('subject', 512);
			table.date('date');

			table.json('recipients');
			table.json('senders');

			table.integer('seqno');
			table.integer('uid');

			table.string('hash', 32);
			table.string('reply_to', 32);
		});

		await this.db.schema.createTable('bodies', table => {
			table.integer('id').primary();

			table.string('body', LocalStore.CACHE_STR_LEN);
			table.date('lastAccessed');
		});

		await this.db.schema.createTable('chains', table => {
			table.increments();

			table.string('topic', 512);
			table.date('date');

			table.boolean('archived').defaultTo('false');

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

		await this.updateChains();

		return emailCount;
	}

	//
	// Get chain listing by Chain ID,
	// retrieving and parsing the data from the db.
	//
	async getChainListing(chainId: number): Promise<ChainListing> {
		const rawChain: SQLChain = 
			(await this.db('chains').select('*').where('id', '=', chainId))[0];

		let conv: ChainListing = {
			id: rawChain.id!,
			topic: rawChain.topic,

			participants: "",

			lastMessageDate: rawChain.date,
			messageIds: []
		};
			
		conv.participants = (await this.db('contacts').select('name')
			.whereIn('id', JSON.parse(rawChain.participants))).map((row) => row.name).sort().join(", ");
		conv.messageIds = 
			(await this.db('messages').select('id').where('chain', '=', rawChain.id)).map((row) => row.id);

		return conv;
	}

	//
	// Get all chain listings on the account,
	// retrieving and parsing the data from the db.
	//
	async getChainListings(): Promise<ChainListing[]> {
		let chains: ChainListing[] = [];
		await Promise.all((await this.db('chains').select('id').where('archived', '=', false)).map(async (row) => 
			chains.push(await this.getChainListing(row.id))));

		chains.sort((a, b) => a.lastMessageDate > b.lastMessageDate ? -1 : 1);
		return chains;
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
	// Get the full chain details of a chain.
	// This includes all of the headers and bodies for the messages included.
	//
	async getChainDetails(chainID: number): Promise<ChainDetails> {
		let details = (await this.getChainListing(chainID)) as ChainDetails;
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

			let current: boolean = 
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
				current: current
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

		ids = Array.from(new Set(ids));
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

					const replyTo = (header['in-reply-to'] || []).join('');

					let message: SQLMessage = {
						box: id,

						subject: (header.subject || []).join(''),
						date: date,
						
						senders: JSON.stringify(senderData),
						recipients: JSON.stringify(recipientData),

						seqno: seqno,
						uid: uid,
						hash: Crypto.createHash('md5').update((header['message-id'] || []).join('')).digest('hex'),
						reply_to: (replyTo == "") ? "" : Crypto.createHash('md5').update(replyTo).digest('hex')
					}

					content.push(message);
				})());
			});
		});

		await Promise.all(promises);

		// Break the upload into chunks to avoid overloading the DB.
		const CHUNK_SIZE = 75;
		for (let i = 0; i < Math.ceil(content.length / CHUNK_SIZE); i++) {
			await this.db('messages').insert(content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
		}
	}

	//
	// Associate emails into chains.
	// Scan the inbox, and then check for associated emails in all boxes that have useInChains enabled.
	// Store the results into the `messages` table in the db.
	//
	private async updateChains() {
		const findChain = async (id: number, reply_to: string): Promise<number> => {
			const parentRows: {id: number, reply_to: string, chain: number}[] = await this.db('messages').select(['id', 'reply_to', 'chain']).where('hash', '=', reply_to);
			
			let chain: number = 0;

			if (parentRows.length != 1) chain = (await this.db('messages').max('chain'))[0]['max(`chain`)'] as number + 1;
			else if (parentRows[0].chain != 0) chain = parentRows[0].chain;
			else chain = await findChain(parentRows[0].id, parentRows[0].reply_to);

			await this.db('messages').update({chain: chain}).where('id', '=', id);
			return chain;
		}

		let row: {id: number, reply_to: string}[] = [];
		while ((row = await this.db('messages').orderBy('seqno', 'desc').select(['id', 'reply_to']).where('chain', '=', 0).limit(1)).length == 1) {
			await findChain(row[0].id, row[0].reply_to);
		}

		const chains = (await this.db('chains').select('id')).map(e => e.id);
		let unChains = (await this.db('messages').distinct('chain')).filter(e => !chains.includes(e.chain)).map(e => e.chain);

		await Promise.all(unChains.map(async (chainId: number) => {
			const latest: SQLMessage = (await this.db('messages').select('*').where('chain', '=', chainId).orderBy('seqno', 'desc').limit(1))[0];

			let archived = !(await this.db('boxes').select('current').where('id', '=', latest.box))[0].current

			let topic = latest.subject;
			if (/<?No subject>?/gi.test(topic) || topic == "") topic = "No Topic";

			topic = topic
				.replace(/^((re|fwd|fw)[: ]+)+/gi, "")					 // Remove junk at the start of the topic.
				.replace(/^\w/, (c: string) => c.toUpperCase()); // Title case the string. 

			const chain: SQLChain = {
				id: chainId,
				topic: topic,
				date: latest.date,
				participants: latest.senders,

				archived: archived
			}

			await this.db('chains').insert(chain);
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

		let messages: {id: number, uid: number, box: number}[] = 
			await this.db('messages').whereIn('id', dbIds).select(['id', 'uid', 'box']);
			
		let parsePromises: Promise<{data: any, uid: number}>[] = [];

		let retrieveBodies = async (messages: {id: number, uid: number, box: number}[]) => {
			if (messages.length == 0) return;
			const boxPath: string = (await this.db('boxes').where('id', '=', messages[0].box).select('path'))[0].path;
			

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

		messages.sort((a, b) => a.box < b.box ? 1 : -1);

		let startInd = 0;
		for (let i = 0; i < messages.length; i++) {
			if (messages[i].box != messages[startInd].box) {
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
