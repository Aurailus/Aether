import * as React from 'react';

import './AccountConversationItem.scss';
import { MessageHeader } from '../../data/MessageHeader';
import { MessageConversation } from '../../data/MessageConversation';

const convIcon = require('../../../res/all-mail.svg');

export interface AccountConversationItemProps {
    conversation: MessageConversation;
    hasUnread: boolean;
    active: boolean;
    onClick: () => void;
}

export class AccountConversationItem extends React.Component<AccountConversationItemProps, {}> {
  constructor(props: AccountConversationItemProps) {
    super(props);
  }

  render() {
    return (
      <div className={"AccountConversationItem " + (this.props.active ? "active" : "")} onClick={this.props.onClick}>
        <img src={convIcon} />
        <span className="AccountConversationItem-unreadIndicator">{this.props.conversation.headers.length}</span>
        <div className="AccountConversationItem-content">  
          <h3>{this.props.conversation.headers[0].from}</h3>
          <h4>{/*<img src={subjectIcon} />*/}{this.props.conversation.headers[0].subject}</h4>
        </div>
      </div>
    );
  }
}
