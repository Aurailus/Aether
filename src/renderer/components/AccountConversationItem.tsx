import * as React from 'react';

import './AccountConversationItem.scss';

import { ConversationListing } from '../../data/Conversation';

const convIcon = require('../../../res/all-mail.svg');

export interface AccountConversationItemProps {
    conversation: ConversationListing;
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
        {/*<span className="AccountConversationItem-unreadIndicator">{this.props.conversation.messageIds.length}</span>*/}
        <div className="AccountConversationItem-content">  
          <h3>{this.props.conversation.participants}</h3>
          <h4>{/*<img src={subjectIcon} />*/}{this.props.conversation.topic}</h4>
        </div>
      </div>
    );
  }
}
