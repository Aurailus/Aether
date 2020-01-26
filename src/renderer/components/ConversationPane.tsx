import * as React from 'react';

import './ConversationPane.scss';

import { ActiveConversationList } from './ActiveConversationList';

import { MessageConversation } from '../../data/MessageConversation';

interface Props {
	conversation: MessageConversation | null
}

export class ConversationPane extends React.Component<Props, {}> {
	constructor(props: Props) {
		super(props);
	}

  render() {
    return (
	    <aside className="ConversationPane">
	      <div className="ConversationPane-header">
	        <h1>{(!this.props.conversation || this.props.conversation.headers.length == 0) ? "" : this.props.conversation.headers[0].subject}</h1>
	        <h2>{(!this.props.conversation || this.props.conversation.headers.length == 0) ? "" : this.props.conversation.headers[0].from}</h2>
	      </div>
	      {(this.props.conversation != null && this.props.conversation.contents.length > 0) && (
      		<ActiveConversationList conversation={this.props.conversation}/>
      	)}
	    </aside>
	  );
	}
}
