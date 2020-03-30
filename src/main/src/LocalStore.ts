import * as fs from 'fs';
import * as Knex from 'knex';
const parseHeader = require('imap').parseHeader;

import { ImapConn } from '../declarations/ImapConn';
import { ImapBox, ImapBoxProps } from '../declarations/ImapBox';

import { SQLMessageHeader } from '../declarations/SQLStructs';

import { ImapAccount } from './ImapAccount';

export class LocalStore {
	account: ImapAccount;
	conn: ImapConn;
	knex: Knex;

	constructor(account: ImapAccount, conn: ImapConn) {
		this.conn = conn;
		this.account = account;

		// TEMP Delete data on startup
		try { fs.unlinkSync('data/cache/' + this.account.props.address + '.sqlite'); } catch (e) {}

		this.knex = Knex({
			client: 'sqlite3',
		  searchPath: ['knex', 'public'],
		  useNullAsDefault: true,
			connection: {
				filename: 'data/cache/' + this.account.props.address + '.sqlite'
			},
		});
	}

	async setup() {
		await this.knex.schema.hasTable('boxes').then(async (has) => {
			if (!has) return this.setupDatabase();
			return null;
		});
	}

	private async setupDatabase() {
		return this.knex.schema.createTable('boxes', table => {
			table.increments();
			table.integer('uidvalidity');

			table.string('name');
			table.string('path');
			table.string('delimiter');
			table.string('attribs');

			table.integer('parent');
			table.string('children');

			table.boolean('useInConversations')
				.defaultTo(false);
		}).then(() => {
			return this.knex.schema.createTable('messages', table => {
				table.increments();
				table.integer('box_id');

				table.string('recipient_address', 1024);
				table.string('sender_address', 1024);

				table.date('date');

				table.string('subject', 1024);
				table.integer('seqno');
				table.integer('uid');
			});
		});
	}

	async updateCache() {
		return new Promise((resolve: () => void, reject: (err: string) => void) => {

			// Collect box information, store it in the `boxes` table.
			this.conn.getBoxes(async (err: string, boxesProps: {[key: string]: ImapBox}) => {
				if (err) reject(err);

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
						children: "",
						useInConversations: useInConversations
					}))[0];

					if (box.children != null) {
						for (let child in box.children) { 
							let dat: {id: number, path: string} = await insertBoxes(knex, child, box.children[child], path, id);

							await knex('boxes').where('id', '=', id).select('children')
							.then((rows: {children: string}[]) => {
								let children = rows[0].children;

								if (children == "") children = dat.id.toString();
								else children += " " + dat.id.toString();

								return knex('boxes').where('id', '=', id).update({children: children});
							});
						}
					}

					return {id: id, path: path};
				}

				for (let box in boxesProps) await insertBoxes(this.knex, box, boxesProps[box]);

				// Get all of the message information from the boxes, store it in the `messages` table.
				let boxes: {id: number, path: string}[] = await this.knex('boxes').select(['id', 'path']);
				
				for (let box of boxes) {

					await new Promise((resolve: () => void, reject: (err: string) => void) => {
						this.conn.openBox(box.path, true, async (err: string, boxProps: ImapBoxProps) => {
							if (err) reject(err);

							await this.knex('boxes').where('id', '=', box.id)
								.update({uidvalidity: boxProps.uidvalidity});

							this.conn.seq.search(['ALL'], (err: string, addSeqNos: number[]) => {
								if (err) reject(err);

								if (addSeqNos && addSeqNos.length > 0) {
									// Box has content
									let content: SQLMessageHeader[] = [];

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
											content.push({
												box_id: box.id,

												subject: (header.subject || []).join(''),
												recipient_address: (header.to || []).join(''),
												sender_address: (header.from || []).join(''),

												date: date,

												seqno: seqno,
												uid: uid
											});
										});
									});

									f.once('error', (err: any) => reject(err));
							    f.once('end', async () => {
										for (let i = 0; i < Math.ceil(content.length / 100); i++)
											await this.knex('messages').insert(content.slice(i * 100, (i + 1) * 100));
										resolve();
							    });
								}
								else {
									// Box is empty
									resolve();
								}
							});
						});
					});
				}

				// this.knex('boxes').select('*').then((rows) => {
				// 	rows.forEach((v: any) => console.log(v));
				// })

				// await this.knex('messages').orderBy('date', 'desc').select('*').where('id', '<', 50).then((rows) => {
				// 	rows.forEach((v: any) => console.log(v));
				// })

				this.knex('messages').select('id').then((rows) => {
					console.log('Account', this.account.props.address, 'loaded', rows.length, 'emails.');
					resolve();
				});
			});
		});	
	}
}
