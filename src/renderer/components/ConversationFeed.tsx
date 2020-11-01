import * as React from 'react';

import './ConversationFeed.scss';

import { MessageFrame } from './MessageFrame';

import { ChainDetails } from '../../data/Chains';

interface Props {
  chain: ChainDetails
}

export class ConversationFeed extends React.Component<Props, {}> {
  frame: any;

  render() {
    return (
    <main className="ConversationFeed">
      <ul>
        {this.props.chain.messages.slice(0).reverse().map((_, ind): any | null => {
          ind = this.props.chain.messages.length - ind - 1;
          let returns: any[] = [];
          returns.push(<MessageFrame key={ind} message={this.props.chain.messages[ind]} />);
          if (ind > 0) returns.push(<hr className="ConversationFeed-hr" key={ind + "_hr"} />);
          return returns;
        })}
      </ul>
    </main>
  );
  }
}
