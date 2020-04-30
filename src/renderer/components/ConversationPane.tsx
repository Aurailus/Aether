import * as React from 'react';

import './ConversationPane.scss';

import { ConversationFeed } from './ConversationFeed';

import { ChainDetails } from '../../data/Chains';

interface Props {
	chain: ChainDetails | null
}

export class ConversationPane extends React.Component<Props, {}> {
	constructor(props: Props) {
		super(props);
	}

  render() {
    return (
	    <aside className="ConversationPane">
	      <div className="ConversationPane-header">
	        <h1>{(!this.props.chain || this.props.chain.messageIds.length == 0) ? "" : this.props.chain.topic}</h1>
	        <h2>{(!this.props.chain || this.props.chain.messageIds.length == 0) ? "" : this.props.chain.participants}</h2>
	      </div>
	      {(this.props.chain != null && this.props.chain.messageIds.length > 0) && (
      		<ConversationFeed chain={this.props.chain}/>
      	)}
	    </aside>
	  );
	}
}
