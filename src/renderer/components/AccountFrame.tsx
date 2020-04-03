import * as React from 'react';
const { ipcRenderer } = require('electron');

import './AccountFrame.scss';

import { LoadingSpinner } from './LoadingSpinner';
import { AccountConversationBar } from './AccountConversationBar';
import { ConversationPane } from './ConversationPane';

import { AccountProps } from '../../data/AccountProps';
import { ConversationListing, ConversationDetails } from '../../data/Conversation';

interface Props {
    account: AccountProps;
}

interface State {
    conversations: ConversationListing[];
    convDetails: ConversationDetails | null;
    activeConv: number; 
}

export class AccountFrame extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { conversations: [], convDetails: null, activeConv: -1 };

    ipcRenderer.on('conversation-listings', (_: Electron.IpcMessageEvent, conversations: ConversationListing[]) => 
      this.handleConversationListings(conversations));
    ipcRenderer.on('conversation-details',  (_: Electron.IpcMessageEvent, conversation: ConversationDetails) => 
      this.handleConversationDetails(conversation));

    this.convClicked = this.convClicked.bind(this);
  }

  handleConversationListings(conversations: ConversationListing[]) {
    this.setState({ activeConv: -1, conversations: conversations });
  }

  handleConversationDetails(conversation: ConversationDetails) {
    this.setState({ convDetails: conversation });
  }

  convClicked(conv: ConversationListing): void {
    ipcRenderer.send('conversation-open', conv.id);
    this.setState({ activeConv: this.state.conversations.indexOf(conv) || 0, convDetails: null });
  }

  render() {
    return (
      <div className="AccountFrame">
        <AccountConversationBar
          account={this.props.account}
          conversations={this.state.conversations}
          activeConv={this.state.activeConv}
          convClicked={this.convClicked}
        />
        <ConversationPane conversation={this.state.convDetails}/>
        <LoadingSpinner 
          style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}}
          visible={this.state.activeConv != -1 && 
                   this.state.conversations[this.state.activeConv].messageIds.length > 0} 
        />
      </div>
    );
  }
}
