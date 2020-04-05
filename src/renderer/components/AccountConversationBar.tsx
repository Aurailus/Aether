import * as React from 'react';
import './AccountConversationBar.scss';

import { AccountProps } from '../../data/AccountProps';
import { ConversationListing } from '../../data/Conversation';

import { AccountConversationList } from './AccountConversationList';
import { LoadingSpinner } from './LoadingSpinner';

const refreshIcon = require('../../../res/ico/icon-refresh.svg');

interface Props {
  account: AccountProps;
  refreshing: boolean;
  
  conversations: ConversationListing[];
  activeConv: number;
  
  convClicked: (message: ConversationListing) => void;
  refreshClicked: () => void;
}

export class AccountConversationBar extends React.Component<Props, {}> {
	constructor(props: Props) {
		super(props);
	}

  render() {
    return (
      <aside className="AccountConversationBar">
        <div className="AccountConversationBar-header">
          <h1>{this.props.account.name}</h1>
          <h2>{this.props.account.address}</h2>

          <button 
            onClick={this.props.refreshClicked}
            className={"AccountConversationBar-refreshButton" + 
              (this.props.account.loaded && this.props.refreshing ? "" : " visible")} >
            <img src={refreshIcon} />
          </button>
          
          <LoadingSpinner 
            visible={this.props.account.loaded && this.props.refreshing} 
            style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}} 
          />
        </div>

        {this.props.account.loaded && (<AccountConversationList
          accountName={this.props.account.name}
          accountEmail={this.props.account.address}
          conversations={this.props.conversations}
          activeConv={this.props.activeConv}
          convClicked={this.props.convClicked}
        />)}

        {!this.props.account.loaded && (<>
          <p className="AccountConversationBar-updatingCacheHeader">Updating Cache</p>
          <p className="AccountConversationBar-updatingCacheSubtext">Please wait just a moment.</p>

          <LoadingSpinner 
            visible={true} 
            style={{position: 'absolute', top: 'calc(50% - 32px)', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px'}}
          />
        </>)}
      </aside>
    );
  }
}
