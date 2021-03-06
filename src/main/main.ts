import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';

import { App } from './src/App';

let win: BrowserWindow | null;

process.on('unhandledRejection', up => { throw up });

const installExtensions = async () => {
	const installer = require('electron-devtools-installer');
	const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
	const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

	return Promise.all(
		extensions.map(name => installer.default(installer[name], forceDownload))
	).catch(console.log);
};

const createWindow = async () => {
	if (process.env.NODE_ENV !== 'production') {
		await installExtensions();
	}

	win = new BrowserWindow({ width: 1366, height: 768, show: false, webPreferences: { nodeIntegration: true }});

	if (process.env.NODE_ENV !== 'production') {
		process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';
		win.loadURL(`http://localhost:2003`);
	} 
	else {
		win.loadURL(
			url.format({
				pathname: path.join(__dirname, 'index.html'),
				protocol: 'file:',
				slashes: true
			})
		);
	}

	// if (process.env.NODE_ENV !== 'production') {
	//     win.webContents.once('dom-ready', () => {
	//         win!.webContents.openDevTools();
	//         win!.show();
	//     });
	// }

	win.webContents.once('did-finish-load', () => {
		win!.show();
		win!.webContents.openDevTools();

		new App(win!);
	});

	win.on('closed', () => {
		win = null;
	});
};

app.on('ready', () => {
	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
	if (win === null) createWindow();
});
