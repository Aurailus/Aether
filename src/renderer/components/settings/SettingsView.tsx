import * as React from 'react';

import './SettingsView.scss';

import { SettingsPageAccounts } from './SettingsPageAccounts';

import { AccountProps } from '../../../data/AccountProps';

interface Props {
  accounts: { [key: string]: AccountProps };
	page: string;
}

export class SettingsView extends React.Component<Props, {}> {
	constructor(props: Props) {
		super(props);
	}

	render() {
		let page: any | null = null;
		let pageName = "accounts";

		switch (pageName) {
			case "accounts": {
				page = <SettingsPageAccounts/>
				break;
			}
		}

		return (
			<div className="SettingsView">
				<div className="SettingsView-SidebarWrap"/>
				{page}
			</div>
		);
	}
}
