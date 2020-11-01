import * as React from 'react';
const { ipcRenderer } = require('electron');

import './App.scss';

import { MainView } from './MainView'; 
import { SettingsView } from './settings/SettingsView';

import { AccountProps } from '../../data/AccountProps';

const allMailImg = require('../../../res/all-mail.svg');
export const ALL_ACCOUNT_ID: string = '*';

interface State {
  accounts: { [key: string]: AccountProps };
  settings: string;
}

export class App extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);

    ipcRenderer.send('reload');

    ipcRenderer.on('settings',   (_: any, page: string) => this.setState({ settings: page }));
    ipcRenderer.on('account-add', (_: any, acct: AccountProps) => this.addAccountHandler(acct));
    ipcRenderer.on('account-load', (_: any, acct: AccountProps) => this.loadAccountHandler(acct));

    this.state = { accounts: {}, settings: "" };
  }

  addAccountHandler(account: AccountProps) {
    const accounts = Object.assign({}, this.state.accounts);
    accounts[account.id] = account;

    if (Object.keys(accounts).length >= 2) {
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
      for (let key in accounts) if (key != ALL_ACCOUNT_ID && !accounts[key].loaded) allLoaded = false;
      accounts[ALL_ACCOUNT_ID].loaded = allLoaded;
      accounts[ALL_ACCOUNT_ID].address = `${Object.keys(accounts).length - 1} Accounts Connected`;
    }

    this.setState({ accounts: accounts });
  }

  loadAccountHandler(account: AccountProps) {
    const accounts = Object.assign({}, this.state.accounts);
    if (accounts[account.id] != undefined) accounts[account.id] = account;

    if (Object.keys(accounts).length > 2) {
      let allLoaded = true;
      for (let key in accounts) if (key != ALL_ACCOUNT_ID && !accounts[key].loaded) allLoaded = false;
      accounts[ALL_ACCOUNT_ID].loaded = allLoaded;
    }

    this.setState({ accounts: accounts });
  }

  render() {
    return (
      <div className="App">
        {this.state.settings == "" ? 
          <MainView accounts={this.state.accounts} /> : 
          <SettingsView accounts={this.state.accounts} page={this.state.settings} /> 
        }
      </div>
    );
  }
}
