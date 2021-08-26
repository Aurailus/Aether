import fs from 'fs';
import { graphql } from 'graphql';
import { ipcMain } from 'electron';

import Log from './Log';
import Account from './Account';
import { Schema, Resolver } from './Graph';
import { openWindow } from './ElectronWindow';

Log.setLogLevel('debug');

(async () => {
	const accounts: Record<string, Account> = {
		'0': new Account('Personal', '../../client/res/user-home.png', {
			username: 'me@auri.xyz',
			password: fs.readFileSync(__dirname + '/../../client/pw.txt').toString().trim(),
			host: 'mail.hover.com',
			port: 993,
			tls: true
		}),
		'1': new Account('Work', '../../client/res/user-work.png', {
			username: 'nicole@aurailus.design',
			password: fs.readFileSync(__dirname + '/../../client/pw.txt').toString().trim(),
			host: 'mail.hover.com',
			port: 993,
			tls: true
		})
	};

	await Promise.all(Object.values(accounts).map(account => account.connect()));

	ipcMain.handle('graphql', async (_, req: { query: string; data: any }) => {
		return graphql(Schema, req.query, Resolver, { accounts }, req.data);
	});

	openWindow();
})();

