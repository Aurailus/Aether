import * as React from 'react';

import './AccountIcon.scss';

import { ImapAccount } from '../../data/ImapAccount';

interface Props {
    account: ImapAccount;
    active: boolean;
    hasUnread: boolean;
    onClick: (e: React.SyntheticEvent) => void;
}

export class AccountIcon extends React.Component<Props, {}> {
    render() {
      return (
      <div
        className={`AccountIcon 
					${this.props.active ? 'active' : ''}
					${this.props.hasUnread ? 'hasUnread' : ''}
				`}
        style={{ backgroundImage: `url("${this.props.account.image}")` }}
        onClick={this.props.onClick}
      />
    );
  }
}
