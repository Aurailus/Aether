import * as React from 'react';
const { ipcRenderer } = require('electron');

import './AccountFrame.scss';

import { LoadingSpinner } from './LoadingSpinner';
import { AccountConversationBar } from './AccountConversationBar';
import { ConversationPane } from './ConversationPane';

import { AccountProps } from '../../data/AccountProps';
import { ChainListing, ChainDetails } from '../../data/Chains';

interface Props {
    account: AccountProps;
}

interface State {
    chains: ChainListing[];
    chainDetails: ChainDetails | null;
    activeConv: number; 
}

export class AccountFrame extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    ipcRenderer.on('conversation-listings', (_: any, conversations: ChainListing[]) => this.handleConversationListings(conversations));
    ipcRenderer.on('conversation-details',  (_: any, conversation: ChainDetails) => this.handleConversationDetails(conversation));

    this.state = { chains: [], chainDetails: null, activeConv: -1 };
    this.convClicked = this.convClicked.bind(this);
  }

  handleConversationListings(chains: ChainListing[]) {
    this.setState({ activeConv: -1, chains: chains });
  }

  handleConversationDetails(chain: ChainDetails) {
    this.setState({ chainDetails: chain });
  }

  convClicked(conv: ChainListing): void {
    ipcRenderer.send('conversation-open', conv.id);
    this.setState({ activeConv: this.state.chains.indexOf(conv) || 0, chainDetails: null });
  }

  render() {
    return (
      <div className="AccountFrame">
        <AccountConversationBar
          account={this.props.account}
          chains={this.state.chains}
          activeConv={this.state.activeConv}
          convClicked={this.convClicked}
        />
        <ConversationPane chain={this.state.chainDetails}/>
        <LoadingSpinner 
          style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}}
          visible={this.state.activeConv != -1 && 
                   this.state.chains[this.state.activeConv].messageIds.length > 0} 
        />
      </div>
    );
  }
}
