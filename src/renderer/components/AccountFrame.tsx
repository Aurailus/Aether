import * as React from 'react';
const { ipcRenderer } = require('electron');

import './AccountFrame.scss';

import { LoadingSpinner } from './LoadingSpinner';
import { AccountConversationBar } from './AccountConversationBar';
import { ConversationPane } from './ConversationPane';

import { AccountProps } from '../../data/AccountProps';
import { ConversationListing } from '../../data/ConversationListing';

interface Props {
    account: AccountProps;
}

interface State {
    conversations: ConversationListing[];
    activeConv: number; 
}

export class AccountFrame extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { conversations: [], activeConv: -1 };
    ipcRenderer.on('conversation-listings', (_event: Electron.IpcMessageEvent, conversations: ConversationListing[]) => this.handleConversationListings(conversations));
    // ipcRenderer.on('conversation-bodies', (_event: Electron.IpcMessageEvent, conversation: MessageConversation) => this.handleConversationBodies(conversation));

    this.convClicked = this.convClicked.bind(this);
  }

  handleConversationListings(conversations: ConversationListing[]) {
    this.setState({ activeConv: -1, conversations: conversations });
  }

  // handleConversationBodies(conversation: ConversationListing) {
  //   this.setState({ activeConversation: conversation });
  // }

  convClicked(conv: ConversationListing): void {
    ipcRenderer.send('conversation-open', conv);
    this.setState({ activeConv: this.state.conversations.indexOf(conv) || 0 });
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
        <ConversationPane conversation={
          this.state.activeConv != -1 ? this.state.conversations[this.state.activeConv] : null}/>
        <LoadingSpinner 
          style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}}
          visible={this.state.activeConv != -1 && 
                   this.state.conversations[this.state.activeConv].messageIds.length > 0} 
        />
      </div>
    );
  }
}
