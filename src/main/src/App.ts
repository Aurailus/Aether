const Imap = require('imap');
const fs = require('fs').promises;
const { ipcMain } = require('electron');

import { StoredImapAccount, StoredImapAccountsList } from '../../data/StoredImapAccounts';
import { ImapConnection } from '../../data/ImapConnection';
import { ImapBox } from '../../data/ImapBox';

export class App {
    window: Electron.BrowserWindow;
    connections: ImapConnection[] = [];
    currentConn: ImapConnection | null = null;

    constructor(window: Electron.BrowserWindow) {
      this.window = window;

      this.connectToAccounts();

      ipcMain.on('account-open', (event: Electron.IpcMessageEvent, acctId: string) =>
      this.handleAccountOpen(acctId)
    );
  }

    handleAccountOpen(id: string) {
      for (const conn of this.connections) {
        if (conn.account.id === id) {
          this.currentConn = conn;
          break;
      }
    }

      if (!this.currentConn) return;

      this.currentConn.imap.getBoxes((err: any, boxes: { [key: string]: ImapBox }) => {
        if (err) {
          console.error(err);
          return;
      }

        this.window.webContents.send('account-boxes', boxes);
    });
  }

    imapConnected(connection: ImapConnection) {
      this.connections.push(connection);
      this.window.webContents.send('account-add', connection.account);

      ipcMain.on('reload', () => this.window.webContents.send('account-add', connection.account));
  }

    connectToAccounts() {
      fs.readFile('data/cred.json').then((data: string) => {
        try {
          const creds: StoredImapAccountsList = JSON.parse(data);

          for (const storedAcct of creds.accounts) {
            new Promise(
            (
              resolve: (connection: ImapConnection) => void,
              reject: (failedAccount: string) => void
            ) => {
                const connection: ImapConnection = {
                  account: {
                    id: storedAcct.id,
                    image: storedAcct.displayImage,
                    name: storedAcct.displayName,
                    email: storedAcct.user,
                    hasUnread: true
                },
                  imap: new Imap(storedAcct)
              };

                connection.imap.once('ready', resolve.bind(this, connection));
                connection.imap.once('error', reject.bind(this, connection.account.email));

                connection.imap.connect();
            }
          )
            .then((connection: ImapConnection) => {
                this.imapConnected(connection);
            })
            .catch((failedAccount: string) => {
                console.log('Failed to log in to', failedAccount);
            });
        }
      } catch (e) {
          console.error('Failed to parse cred.json.');
          process.exit(1);
      }
    });
  }
}
