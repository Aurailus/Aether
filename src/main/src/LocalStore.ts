// const knex = require('knex');
// import * as Knex from 'knex';

import { InternalImapConn } from '../declarations/InternalImapConn';

import { ImapAccount } from './ImapAccount';

export class LocalStore {
	account: ImapAccount;
	conn: InternalImapConn;
	// knex: Knex;

	constructor(account: ImapAccount, conn: InternalImapConn) {
		this.conn = conn;
		this.account = account;
		console.log('STARTING KNEX');

		// this.knex = Knex({
		// 	client: 'sqlite3',
		//   searchPath: ['knex', 'public'],
		// 	connection: {
		// 		filename: 'data/cache/' + this.account.props.address + '.sqlite'
		// 	},
		// });

		// console.log('CREATING TABLE');

		// this.knex.schema.createTable('boxes', (table: Knex.TableBuilder) => {
		// 	table.increments();
		// 	table.string('name');
		// 	table.boolean('conversations');
		// });
	}

	async updateCache() {
		
	}
}
