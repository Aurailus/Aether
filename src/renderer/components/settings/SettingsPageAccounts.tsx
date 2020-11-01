import * as React from 'react';

import './SettingsPageAccounts.scss';

import { AccountCreateModal, AccountCreateModalFields } from './AccountCreateModal';

const iconConv = require('../../../../res/ico/icon-user.svg');
const iconAdd = require('../../../../res/ico/icon-add.svg');

interface Props {

}

interface State {
	creating: boolean;
}

export class SettingsPageAccounts extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = { creating: false }

		this.submitHandler = this.submitHandler.bind(this);
		this.cancelHandler = this.cancelHandler.bind(this);
	}
	private submitHandler(fields: AccountCreateModalFields) {
		console.log(fields);
		this.setState({ creating: false });
	}

	private cancelHandler() {
		this.setState({ creating: false });
	}

	render() {
		return <div className="SettingsPage SettingsPageAccounts">

			<h1>Accounts</h1>

			<h2>Email Accounts</h2>

			<div className="SettingsPageAccounts-Account">
        <img className="SettingsPageAccounts-AccountIcon" src={iconConv} />
        <h2 className="SettingsPageAccounts-AccountName">Personal</h2>
        <h3 className="SettingsPageAccounts-AccountLabel">Nicole Collings</h3>
        <p className="SettingsPageAccounts-AccountAddress">me@auri.xyz</p>
			</div>

			<div className="SettingsPageAccounts-Account">
        <img className="SettingsPageAccounts-AccountIcon" src={iconConv} />
        <h2 className="SettingsPageAccounts-AccountName">Work</h2>
        <h3 className="SettingsPageAccounts-AccountLabel">Nicole Collings</h3>
        <p className="SettingsPageAccounts-AccountAddress">nicole@aurailus.design</p>
			</div>

			<button 
				className="SettingsPageAccounts-CreateAccount" 
				onClick={() => this.setState({ creating: true })}>
				<img src={iconAdd} />
				Add Email Account
			</button>

			<h2>SMS Accounts</h2>

			<div className="SettingsPageAccounts-Account">
        <img className="SettingsPageAccounts-AccountIcon" src={iconConv} />
        <h2 className="SettingsPageAccounts-AccountName">Cell Phone</h2>
        <h3 className="SettingsPageAccounts-AccountLabel">Nicole Collings</h3>
        <p className="SettingsPageAccounts-AccountAddress">604-414-0000</p>
			</div>

			<button 
				className="SettingsPageAccounts-CreateAccount" 
				onClick={() => this.setState({ creating: true })}>
				<img src={iconAdd} />
				Add SMS Account
			</button>

			{this.state.creating && <div className="SettingsPageAccounts-CreateModalWrap">
				<AccountCreateModal
					submit={this.submitHandler}
					cancel={this.cancelHandler}
				/>
			</div>}
		</div>
	}
}
