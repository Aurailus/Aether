import * as React from 'react';

import './SettingsView.scss';

import { AccountCreateModal } from './AccountCreateModal';

interface Props {
	page: string;
}

export class SettingsView extends React.Component<Props, {}> {
	render() {
		return (
			<div className="SettingsView">
				<AccountCreateModal/>
			</div>
		);
	}
}
