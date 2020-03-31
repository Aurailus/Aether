import * as React from 'react';
const { ipcRenderer } = require('electron');

import './App.scss';

import { AccountBar } from './AccountBar';
import { AccountFrame } from './AccountFrame';
import { AccountProps } from '../../data/AccountProps';

const allMailImg = require('../../../res/all-mail.svg');

export const ALL_ACCOUNT_ID: string = '*';

interface State {
  accounts: { [key: string]: AccountProps };
  activeAccount: string;
}

export class App extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      accounts: {},
      activeAccount: ''
    };

    ipcRenderer.send('reload');
    ipcRenderer.on('account-add',  (_event: Electron.IpcMessageEvent, arg: AccountProps) => this.addAccountHandler(arg));
    ipcRenderer.on('account-load', (_event: Electron.IpcMessageEvent, arg: AccountProps) => this.loadAccountHandler(arg));

    this.accountClickHandler = this.accountClickHandler.bind(this);
  }

  addAccountHandler(account: AccountProps) {
    const accounts = Object.assign({}, this.state.accounts);
    accounts[account.id] = account;
    const accountsLen = Object.keys(accounts).length;

    if (accountsLen >= 2) {
      if (accounts[ALL_ACCOUNT_ID] == null) {
        accounts[ALL_ACCOUNT_ID] = {
          image: allMailImg,
          loaded: false,
          name: 'All Accounts',
          address: `${Object.keys(accounts).length} Accounts Connected`,
          hasUnread: false,
          id: ALL_ACCOUNT_ID
        };
      }

      let allLoaded = true;
      for (let key in accounts) {
        if (key != ALL_ACCOUNT_ID && !accounts[key].loaded) {
          allLoaded = false;
          break;
        }
      }

      accounts[ALL_ACCOUNT_ID].loaded = allLoaded;
    }

    if (accountsLen > 2) {
      accounts[ALL_ACCOUNT_ID].address = `${accountsLen - 1} Accounts Connected`;
    }

    this.setState({ 
      accounts: accounts,
      activeAccount: (accountsLen >= 2 ? ALL_ACCOUNT_ID : Object.keys(accounts)[0])
    });
  }

  loadAccountHandler(account: AccountProps) {
    const accounts = Object.assign({}, this.state.accounts);
    if (accounts[account.id] != undefined) accounts[account.id] = account;

    if (Object.keys(accounts).length > 2) {
      let allLoaded = true;
      for (let key in accounts) {
        if (key != ALL_ACCOUNT_ID && !accounts[key].loaded) {
          allLoaded = false;
          break;
        }
      }
      accounts[ALL_ACCOUNT_ID].loaded = allLoaded;
    }

    this.setState({ accounts: accounts });
  }

  accountClickHandler(id: string, _: React.SyntheticEvent) {
    if (this.state.activeAccount != id) {
      const accounts = Object.assign({}, this.state.accounts);
      if (accounts[id]) accounts[id].hasUnread = false;

      this.setState({ accounts, activeAccount: id });
      ipcRenderer.send('account-open', id);
    }
  }

  render() {
    return (
      <div className="App">
        <AccountBar
          accounts={this.state.accounts}
          activeAccount={this.state.activeAccount}
          onClick={this.accountClickHandler}
        />
        {this.state.accounts[this.state.activeAccount] != null && (
          <AccountFrame account={this.state.accounts[this.state.activeAccount]} />
        )}
      </div>
    );
  }
}
