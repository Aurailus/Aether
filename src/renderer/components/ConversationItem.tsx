import * as React from 'react';

import './ConversationItem.scss';
import { MessageHeader } from '../../data/MessageHeader';
import { MessageConversation } from '../../data/MessageConversation';

const convIcon = require('../../../res/all-mail.svg');
const subjectIcon = require('../../../res/icon-tag.svg');

export interface ConversationItemProps {
    conversation: MessageConversation;
    hasUnread: boolean;
    active: boolean;
    onClick: () => void;
}

export class ConversationItem extends React.Component<ConversationItemProps, {}> {
  constructor(props: ConversationItemProps) {
    super(props);
  }

  render() {
    return (
      <div className={"ConversationItem " + (this.props.active ? "active" : "")} onClick={this.props.onClick}>
        <img src={convIcon} />
        <span className="ConversationItem-unreadIndicator">{this.props.conversation.headers.length}</span>
        <div className="ConversationItem-content">  
          <h3>{this.props.conversation.headers[0].from}</h3>
          <h4>{/*<img src={subjectIcon} />*/}{this.props.conversation.headers[0].subject}</h4>
        </div>
      </div>
    );
  }
}
