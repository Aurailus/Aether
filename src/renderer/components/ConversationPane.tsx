import * as React from 'react';

import './ConversationPane.scss';

// import { ConversationFeed } from './ConversationFeed';

import { ConversationListing } from '../../data/ConversationListing';

interface Props {
	conversation: ConversationListing | null
}

export class ConversationPane extends React.Component<Props, {}> {
	constructor(props: Props) {
		super(props);
	}

  render() {
    return (
	    <aside className="ConversationPane">
	      <div className="ConversationPane-header">
	        <h1>{(!this.props.conversation || this.props.conversation.messageIds.length == 0) ? "" : this.props.conversation.topic}</h1>
	        <h2>{(!this.props.conversation || this.props.conversation.messageIds.length == 0) ? "" : this.props.conversation.participants}</h2>
	      </div>
	      {/*{(this.props.conversation != null && this.props.conversation..length > 0) && (
      		<ConversationFeed conversation={this.props.conversation}/>
      	)}*/}
	    </aside>
	  );
	}
}
