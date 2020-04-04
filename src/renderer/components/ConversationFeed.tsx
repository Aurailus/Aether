import * as React from 'react';

import './ConversationFeed.scss';

import { MessageFrame } from './MessageFrame';

import { ConversationDetails } from '../../data/Conversation';

interface Props {
  conv: ConversationDetails
}

export class ConversationFeed extends React.Component<Props, {}> {
  frame: any;

  render() {
    return (
    <main className="ConversationFeed">
      <ul>
        {this.props.conv.messages.slice(0).reverse().map((_, ind): any | null => {
          ind = this.props.conv.messages.length - ind - 1;
          let returns: any[] = [];
          returns.push(<MessageFrame key={ind} message={this.props.conv.messages[ind]} />);
          if (ind > 0) returns.push(<hr className="ConversationFeed-hr" key={ind + "_hr"} />);
          return returns;
        })}
      </ul>
    </main>
  );
  }
}
