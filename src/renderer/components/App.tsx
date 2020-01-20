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

    const state = {
      accounts: {},
      activeAccount: ''
    };

    state.activeAccount = Object.keys(state.accounts)[0] || '';
    this.state = state;

    ipcRenderer.send('reload');
    ipcRenderer.on('account-add', (event: Electron.IpcMessageEvent, arg: AccountProps) => this.addAccountHandler(arg));

    this.accountClickHandler = this.accountClickHandler.bind(this);
  }

  addAccountHandler(account: AccountProps) {
    const accounts = Object.assign({}, this.state.accounts);
    accounts[account.id] = account;

    if (accounts[ALL_ACCOUNT_ID] == null && Object.keys(accounts).length >= 2) {
      accounts[ALL_ACCOUNT_ID] = {
        image: allMailImg,
        name: 'All Accounts',
        email: `${Object.keys(accounts).length} Accounts Connected`,
        hasUnread: false,
        id: ALL_ACCOUNT_ID
      };
    }
    if (Object.keys(accounts).length > 2) {
      accounts[ALL_ACCOUNT_ID].email = `${Object.keys(accounts).length - 1} Accounts Connected`;
    }

    this.setState({ accounts });
  }

  accountClickHandler(id: string, e: React.SyntheticEvent) {
    const accounts = Object.assign({}, this.state.accounts);
    if (accounts[id]) accounts[id].hasUnread = false;

    this.setState({ accounts, activeAccount: id });
    ipcRenderer.send('account-open', id);
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
