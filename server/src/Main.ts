// import fs from 'fs';
import mongoose from 'mongoose';

// import { graphql } from 'graphql';
import { ipcMain } from 'electron';

import Log from './Log';
import Account from './Account';
import * as DB from './data/Data';
// import { Schema, Resolver } from './Graph';
// import { openWindow } from './ElectronWindow';

Log.setLogLevel('all');

(async () => {
	// openWindow();
	Log.info('Initialized.');

	await mongoose.connect('mongodb://localhost:27017/aether',{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: true
	} as mongoose.ConnectOptions);

	Log.info('Connected to Mongoose.');

	// await DB.AccountModel.deleteMany({});
	// await DB.AccountModel.insertMany([{
	// 	name: 'Personal',
	// 	image: '../../client/res/user-home.png',
	// 	address: 'me@auri.xyz',
	// 	password: fs.readFileSync(__dirname + '/../../client/pw.txt').toString().trim(),
	// 	host: 'mail.hover.com',
	// 	port: 993,
	// 	tls: true
	// }, {
	// 	name: 'Work',
	// 	image: '../../client/res/user-work.png',
	// 	address: 'nicole@aurailus.design',
	// 	password: fs.readFileSync(__dirname + '/../../client/pw.txt').toString().trim(),
	// 	host: 'mail.hover.com',
	// 	port: '993',
	// 	tls: true
	// }] as DB.Create<DB.Account>[]);

	Log.perfStart('Initial DB Fetch');
	const dbAccounts = (await DB.AccountModel.find({}))!;
	Log.perfEnd('Initial DB Fetch');

	Log.perfStart('Accounts Connect');
	await Promise.all(dbAccounts.map(async dbAccount => {
		const account = new Account(dbAccount);
		await account.init();
		return account;
	}));
	Log.perfEnd('Accounts Connect');

	ipcMain.handle('graphql', async (_, _req: { query: string; data: any }) => {
		return { data: { } };
	});
// 		return graphql(Schema, req.query, Resolver, { accounts }, req.data);
// 	});
})();
