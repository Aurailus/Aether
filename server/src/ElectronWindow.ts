import path from 'path';
import { app, BrowserWindow, dialog } from 'electron';

dialog.showErrorBox = () => { /* Disable displaying error box. */ };

export async function openWindow() {
	app.whenReady().then(() => {
		const window = new BrowserWindow({
			width: 1400,
			height: 800,
			title: 'Aether',
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				enableRemoteModule: false,
				preload: path.join(__dirname, 'Preload.js')
			}
		});

		window.removeMenu();
		window.loadFile('src/View.html');

		window.webContents.openDevTools();
	});

	app.on('window-all-closed', () => app.quit());
}
