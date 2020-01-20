import * as React from 'react';

import './AccountBar.scss';

import { ALL_ACCOUNT_ID } from './App';
import { AccountProps } from '../../data/AccountProps';
import { AccountIcon } from './AccountIcon';

interface Props {
    accounts: { [key: string]: AccountProps };
    activeAccount: string;
    onClick: (id: string, e: React.SyntheticEvent) => void;
}

export class AccountBar extends React.Component<Props, {}> {
    constructor(props: Props) {
      super(props);
  }

    handleClick(id: string, e: React.SyntheticEvent) {
      this.props.onClick(id, e);
  }

    render() {
      if (this.props.accounts[ALL_ACCOUNT_ID]) {
        let unreads: boolean = false;
        for (const acct in this.props.accounts) {
          if (acct === ALL_ACCOUNT_ID) continue;
          if (this.props.accounts[acct].hasUnread) {
            unreads = true;
            break;
        }
      }
        this.props.accounts[ALL_ACCOUNT_ID].hasUnread = unreads;
    }

      const allAcct = this.props.accounts[ALL_ACCOUNT_ID];

      return (
      <div className="AccountBar">
        <ul>
          {this.props.accounts[ALL_ACCOUNT_ID] != null && (
            <>
              <AccountIcon
                key={ALL_ACCOUNT_ID}
                account={allAcct}
                active={this.props.activeAccount === ALL_ACCOUNT_ID}
                hasUnread={allAcct.hasUnread}
                onClick={this.handleClick.bind(this, ALL_ACCOUNT_ID)}
              />
              <hr className="AccountBar-separator" />
            </>
          )}

          {Object.keys(this.props.accounts).map((id, i) => {
              if (id === ALL_ACCOUNT_ID) return;
              const acct = this.props.accounts[id];
              return (
              <AccountIcon
                key={id}
                account={acct}
                active={this.props.activeAccount === id}
                hasUnread={acct.hasUnread}
                onClick={this.handleClick.bind(this, id)}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}
