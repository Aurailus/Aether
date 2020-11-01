import * as React from 'react';
import './ConversationDateHeader.scss';

export class ConversationDateHeader extends React.Component<{header: string}, {}> {
  render() {
    return (
    	<div className="ConversationDateHeader">
    		<p>{this.props.header}</p>
  		</div>
  	);
  }
}
