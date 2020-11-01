import * as React from 'react';
const { ipcRenderer } = require('electron');

import './MainView.scss';

import { AccountBar } from './AccountBar';
import { AccountFrame } from './AccountFrame';

import { AccountProps } from '../../data/AccountProps';

interface Props {
  accounts: { [key: string]: AccountProps };
}

interface State {
	activeAccount: string;
}

export class MainView extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { activeAccount: "" }
		
    this.accountClickHandler = this.accountClickHandler.bind(this);
	}

  accountClickHandler(id: string, _: React.SyntheticEvent) {
    if (this.state.activeAccount != id) {
      this.setState({ activeAccount: id });
      ipcRenderer.send('account-open', id);
    }
  }

	render() {
		return (
			<div className="MainView">
				<AccountBar
					accounts={this.props.accounts}
					activeAccount={this.state.activeAccount}
					onClick={this.accountClickHandler}
				/>

				{this.props.accounts[this.state.activeAccount] != null && <AccountFrame 
					account={this.props.accounts[this.state.activeAccount]}
				/>}
			</div>
		);
	}
}
