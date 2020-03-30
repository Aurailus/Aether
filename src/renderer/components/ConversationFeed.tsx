import * as React from 'react';

import './ConversationFeed.scss';

import { MessageConversation } from '../../data/MessageConversation';
import { ConversationFrame } from './ConversationFrame';

interface Props {
  conversation: MessageConversation
}

export class ConversationFeed extends React.Component<Props, {}> {
  frame: any;

  render() {
    return (
    <main className="ConversationFeed">
      <ul>
        {this.props.conversation.headers.slice(0).reverse().map((head, ind): any | null => {
          ind = this.props.conversation.headers.length - ind - 1;
          if (this.props.conversation.contents.length > ind) {
            let returns: any[] = [];
            returns.push(<ConversationFrame key={ind} header={head} content={this.props.conversation.contents[ind]} />);
            if (ind > 0) returns.push(<hr className="ConversationFeed-hr" key={ind + "_hr"} />);
            return returns;
          }
        })}
      </ul>
    </main>
  );
  }
}
