import * as fs from 'fs';
import * as Knex from 'knex';
const parseHeader = require('imap').parseHeader;

import { ImapConn } from '../declarations/ImapConn';
import { ImapBox, ImapBoxProps } from '../declarations/ImapBox';
import { SQLMessage, SQLBox, SQLConversation } from '../declarations/SQLStructs';

import { ConversationListing } from '../../data/ConversationListing';

import { ImapAccount } from './ImapAccount';

export class LocalStore {
	private account: ImapAccount;
	private conn: ImapConn;
	private db: Knex;

	constructor(account: ImapAccount, conn: ImapConn) {
		this.conn = conn;
		this.account = account;

		// TEMP Delete data on startup
		try { fs.unlinkSync('data/cache/' + this.account.props.address + '.sqlite'); } catch (e) {}

		this.db = Knex({
			client: 'sqlite3',
		  searchPath: ['knex', 'public'],
		  useNullAsDefault: true,
			connection: {
				filename: 'data/cache/' + this.account.props.address + '.sqlite'
			},
		});
	}

	//
	// Get conversation listings.
	// This information is only the Conversation ID, subject, participants, and date.
	// Full bodies will be sent upon interaction.
	//
	async getConversationListings(): Promise<ConversationListing[]> {
		let conversations = 
			(await this.db('conversations').select('*')).map((cv: SQLConversation): ConversationListing => {
			return {
				id: cv.id!,
				topic: cv.topic,

				participants: JSON.parse(cv.participants),

				lastMessageDate: cv.date,
				messageIds: []
			};
		});

		conversations.sort((a, b) => a.lastMessageDate > b.lastMessageDate ? -1 : 1);

		for (let conv of conversations) {
			conv.messageIds = 
				(await this.db('messages').select('id').where('conv_id', '=', conv.id)).map((row) => row.id);
		}

		return conversations;
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
		});

		await this.db.schema.createTable('conversations', table => {
			table.increments();

			table.string('topic', 512);
			table.date('date');

			table.json('participants');
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
	// Get the layout of boxes on the Imap server,
	// and store the information in the `boxes` table in the knex db.
	//
	private async syncBoxes() {
		return new Promise((resolve: () => void, reject: (err: string) => void) => {
			try {
				this.conn.getBoxes(async (err: string, boxesProps: {[key: string]: ImapBox}) => {
					if (err) throw(err);

					async function insertBoxes(knex: Knex, name: string, box: ImapBox, path?: string, parentId?: number): Promise<{id: number, path: string}> {
						path = (path ? path + box.delimiter + name : name);

						let useInConversations: boolean = 
							name == "INBOX" ||
							box.attribs.includes('\\Sent') || 
							box.attribs.includes('\\Trash');

						let id: number = (await knex('boxes').insert({
							name: name,
							path: path,
							delimiter: box.delimiter,
							attribs: box.attribs.join(' '),
							parent: (parentId === undefined ? null : parentId),
							children: JSON.stringify([]),
							useInConversations: useInConversations
						} as SQLBox))[0];

						if (box.children != null) {
							for (let child in box.children) { 
								let dat: {id: number, path: string} = await insertBoxes(knex, child, box.children[child], path, id);

								await knex('boxes').where('id', '=', id).select('children')
								.then((rows: {children: string}[]) => {
									let children: number[] = JSON.parse(rows[0].children) || [];
									children.push(dat.id);

									return knex('boxes').where('id', '=', id).update({children: children});
								});
							}
						}

						return {id: id, path: path};
					}

					for (let box in boxesProps) await insertBoxes(this.db, box, boxesProps[box]);

					resolve();
				});
			}
			catch (e) {
				reject(e);
			}
		});
	}

	//
	// Get all of the email headers from a specified box on the Imap server,
	// and store the information in the `messages` table in the knex db.
	//
	private async syncMessages(boxPath: string) {
		await new Promise((resolve: () => void, reject: (err: string) => void) => {
			this.conn.openBox(boxPath, true, async (err: string, boxProps: ImapBoxProps) => {
				if (err) reject(err);

				const id = (await this.db('boxes').where('path', '=', boxPath).select('id'))[0].id;

				await this.db('boxes').where('id', '=', id)
					.update({uidvalidity: boxProps.uidvalidity});

				function namesAndAddrs(header: string[]): {names: string[], addrs: string[]} {
					const nameRegex = /^["']*([\w-@.0-9/ ]+)["']*/;
					const addrRegex = /<?([\w\-0-9]+@[\w\-0-9]+(?:\.[\w0-9]+)+)>?$/;

					const data: {names: string[], addrs: string[]} = {names: [], addrs: []};

					((header && header.length > 0) ? (header.join('\t').split('\t')) : []).forEach((v: string) => {
						let name: any = v.trim().match(nameRegex) || v.trim().match(addrRegex) || null;
						let addr: any = v.trim().match(addrRegex) || null;

						// if (addr == null) {
						// 	console.log("couldn't parse", header);
						// }
						
						if (name != null && name[1] != null) data.names.push(name[1] as string); 
						if (addr != null && addr[1] != null) data.addrs.push(addr[1] as string); 
					});

					return data;
				}

				this.conn.seq.search(['ALL'], (err: string, addSeqNos: number[]) => {
					if (err) reject(err);

					if (addSeqNos && addSeqNos.length > 0) {
						let content: SQLMessage[] = [];

						let f = this.conn.seq.fetch(addSeqNos, {
							bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)"
						});

						f.on('message', (msg: any, seqno: number) => {
							let header: any;
							let uid: number = 0;

							msg.on('body', function(stream: any) {
				        let buffer = "";
				        stream.on('data', (chunk: any) => buffer += chunk.toString('utf8'));
				        stream.once('end', () => header = parseHeader(buffer));
				      });

				      msg.on('attributes', (a: any) => uid = a.uid);

							msg.once('end', () => {
								let date = Date.parse(header.date.join(''));

								const recipientData = namesAndAddrs(header.to);
								const senderData = namesAndAddrs(header.from);

								content.push({
									box_id: id,
									conv_id: 0,

									subject: (header.subject || []).join(''),
									
									senders: JSON.stringify(senderData.addrs),
									recipients: JSON.stringify(recipientData.addrs),

									date: date,
									seqno: seqno,
									uid: uid
								});
							});
						});

						f.once('error', (err: any) => reject(err));
				    f.once('end', async () => {
				    	// Break the upload into chunks to avoid overloading the DB.
				    	const CHUNK_SIZE = 50;
							for (let i = 0; i < Math.ceil(content.length / CHUNK_SIZE); i++) {
								await this.db('messages').insert(content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
							}
							resolve();
				    });
					}
					else {
						// The box is empty.
						resolve();
					}
				});
			});
		});
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

			const conv_id = (await this.db('conversations').insert({
				topic: chain[chain.length - 1].subject,
				date: chain[chain.length - 1].date,
				participants: participants
			} as SQLConversation))[0];

			const ids = chain.map((elem: SQLMessage) => elem.id);
			await this.db('messages').whereIn('id', ids).update("conv_id", conv_id);
		}));
	}
}
