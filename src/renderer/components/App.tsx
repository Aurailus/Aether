import * as React from 'react';
const { ipcRenderer } = require('electron');

import './App.scss';

import { AccountBar } from './AccountBar';
import { AccountFrame } from './AccountFrame';
import { SettingsView } from './SettingsView';

import { AccountProps } from '../../data/AccountProps';

const allMailImg = require('../../../res/all-mail.svg');
export const ALL_ACCOUNT_ID: string = '*';

interface AccountState {
  activeAccount: string;
}

interface SettingsState {
  page: string;
}

interface State {
  accounts: { [key: string]: AccountProps };
  loc: AccountState | SettingsState;
}

export class App extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      accounts: {},
      loc: { activeAccount: '' },
    };

    ipcRenderer.send('reload');

    ipcRenderer.on('account-add',  (_: any, acct: AccountProps) => this.addAccountHandler(acct));
    ipcRenderer.on('account-load', (_: any, acct: AccountProps) => this.loadAccountHandler(acct));

    ipcRenderer.on('settings', (_: any, page: string) => this.setState({loc: { page: page }}));

    this.refreshClickHandler = this.refreshClickHandler.bind(this);
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
      loc: { activeAccount: (accountsLen >= 2 ? ALL_ACCOUNT_ID : Object.keys(accounts)[0]) }
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
    if ((this.state.loc as AccountState).activeAccount != id) {
      const accounts = Object.assign({}, this.state.accounts);
      if (accounts[id]) accounts[id].hasUnread = false;

      this.setState({ accounts, loc: { activeAccount: id }});
      ipcRenderer.send('account-open', id);
    }
  }

  refreshClickHandler(_id: string) {
    // this.setState();

    // setTimeout(() => this.setState({refreshing: false}), 1500);
  }

  render() {

    if ((this.state.loc as AccountState).activeAccount != undefined) {
      let acct = this.state.loc as AccountState;
      return (
        <div className="App">
          <AccountBar
            accounts={this.state.accounts}
            activeAccount={acct.activeAccount}
            onClick={this.accountClickHandler}
          />
          {this.state.accounts[acct.activeAccount] != null && (
            <AccountFrame 
              account={this.state.accounts[acct.activeAccount]}
              refreshClicked={this.refreshClickHandler}
              refreshing={false} 
            />
          )}
        </div>
      );
    }
    else {
      let settings = this.state.loc as SettingsState;
      return (
        <div className="App">
          <SettingsView
            page={settings.page}
          />
        </div>
      );
    }
  }
}
