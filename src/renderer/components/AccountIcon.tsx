import * as React from 'react';

import './AccountIcon.scss';

import { AccountProps } from '../../data/AccountProps';

import { LoadingSpinner } from './LoadingSpinner';

interface Props {
    account: AccountProps;
    active: boolean;
    hasUnread: boolean;
    onClick: (e: React.SyntheticEvent) => void;
}

export class AccountIcon extends React.Component<Props, {}> {
    render() {
      return (
      <div
        className={`AccountIcon 
					${(this.props.active) ? 'active' : ''}
					${(this.props.account.loaded && this.props.hasUnread) ? 'hasUnread' : ''}`}

        style={{
          backgroundImage: (this.props.account.loaded || this.props.account.id == "*") ? 
            `url("${this.props.account.image}")` : ''}}
        onClick={this.props.onClick}>

        {(!this.props.account.loaded && this.props.account.id != "*") && <LoadingSpinner visible={true}
          style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px'}}
        />}
      </div>
    );
  }
}
