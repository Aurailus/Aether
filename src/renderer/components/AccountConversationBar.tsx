import * as React from 'react';
import './AccountConversationBar.scss';

import { MessageHeader } from '../../data/MessageHeader';
import { MessageConversation } from '../../data/MessageConversation';

import { AccountConversationList } from './AccountConversationList';
import { LoadingSpinner } from './LoadingSpinner';

const conversationViewIcon = require('../../../res/icon-conversation-view.svg');
const boxViewIcon = require('../../../res/icon-box.svg');

interface Props {
  accountName: string;
  accountEmail: string;
  
  conversations: MessageConversation[];
  activeConversation: MessageConversation | null;
  
  convClicked: (message: MessageConversation) => void;
}

interface State {
	view: string;
}

export class AccountConversationBar extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {view: "conversations"};
    this.changeView = this.changeView.bind(this);
	}

  changeView() {
    this.setState({view: (this.state.view == "conversations" ? "box" : "conversations")});
  }

  render() {
    return (
      <aside className="AccountConversationBar">
        <div className="AccountConversationBar-header">
          <h1>{this.props.accountName}</h1>
          <h2>{this.props.accountEmail}</h2>

          <button className="AccountConversationBar-switchViewButton" onClick={this.changeView}>
            <img src={(this.state.view == "conversations" ? conversationViewIcon : boxViewIcon)} />
          </button>
        </div>

        {this.state.view == "conversations" && (<AccountConversationList
          accountName={this.props.accountName}
          accountEmail={this.props.accountEmail}
          conversations={this.props.conversations}
          activeConversation={this.props.activeConversation}
          convClicked={this.props.convClicked}
        />)}

        <LoadingSpinner 
          visible={this.props.conversations.length <= 0} 
          style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px'}}
        />
      </aside>
    );
  }
}
