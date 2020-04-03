import * as React from 'react';
import './AccountConversationBar.scss';

import { AccountProps } from '../../data/AccountProps';
import { ConversationListing } from '../../data/Conversation';

import { AccountConversationList } from './AccountConversationList';
import { LoadingSpinner } from './LoadingSpinner';

interface Props {
  account: AccountProps;
  
  conversations: ConversationListing[];
  activeConv: number;
  
  convClicked: (message: ConversationListing) => void;
}

interface State {
	view: string;
}

export class AccountConversationBar extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {view: "conversations"};
    // this.changeView = this.changeView.bind(this);
	}

  // changeView() {
  //   this.setState({view: (this.state.view == "conversations" ? "box" : "conversations")});
  // }

  render() {
    return (
      <aside className="AccountConversationBar">
        <div className="AccountConversationBar-header">
          <h1>{this.props.account.name}</h1>
          <h2>{this.props.account.address}</h2>

          {/*<button className="AccountConversationBar-switchViewButton" onClick={this.changeView}>
            <img src={(this.state.view == "conversations" ? conversationViewIcon : boxViewIcon)} />
          </button>*/}
          
          <LoadingSpinner 
            visible={this.props.account.loaded && this.props.conversations.length <= 0} 
            style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}}/>
        </div>

        {this.props.account.loaded && this.state.view == "conversations" && (
        <AccountConversationList
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
