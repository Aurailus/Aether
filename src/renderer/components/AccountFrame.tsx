import * as React from 'react';
const { ipcRenderer } = require('electron');

import './AccountFrame.scss';

import { LoadingSpinner } from './LoadingSpinner';
import { AccountConversationBar } from './AccountConversationBar';
import { ConversationPane } from './ConversationPane';

import { AccountProps } from '../../data/AccountProps';
import { MessageConversation } from '../../data/MessageConversation';

interface Props {
    account: AccountProps;
}

interface State {
    conversations: MessageConversation[];
    activeConversation: MessageConversation | null; 
}

export class AccountFrame extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { conversations: [], activeConversation: null };
    ipcRenderer.on('conversations', (_event: Electron.IpcMessageEvent, conversations: MessageConversation[]) => this.handleConversations(conversations));
    ipcRenderer.on('conversation-bodies', (_event: Electron.IpcMessageEvent, conversation: MessageConversation) => this.handleConversationBodies(conversation));

    this.convClicked = this.convClicked.bind(this);
  }

  handleConversations(conversations: MessageConversation[]) {
    this.setState({ conversations: conversations });
  }

  handleConversationBodies(conversation: MessageConversation) {
    this.setState({ activeConversation: conversation });
  }

  convClicked(conv: MessageConversation): void {
    ipcRenderer.send('conversation-open', conv);
    this.setState({ activeConversation: conv });
  }

  render() {
    return (
      <div className="AccountFrame">
        <AccountConversationBar
          accountName={this.props.account.name}
          accountEmail={this.props.account.address}
          conversations={this.state.conversations}
          activeConversation={this.state.activeConversation}
          convClicked={this.convClicked}
        />
        <ConversationPane conversation={this.state.activeConversation}/>
        <LoadingSpinner 
          visible={this.state.activeConversation != null && this.state.activeConversation.headers.length > 0 && this.state.activeConversation.contents.length == 0} 
          style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}}
        />
      </div>
    );
  }
}
