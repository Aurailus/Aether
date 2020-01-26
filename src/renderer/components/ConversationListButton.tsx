import * as React from 'react';

import './ConversationListButton.scss';

export interface ConversationListButtonProps {
    title: string,
    icon: any
    onClick: () => void;
}

export class ConversationListButton extends React.Component<ConversationListButtonProps, {}> {
  constructor(props: ConversationListButtonProps) {
    super(props);
  }

  render() {
    return (
      <div className="ConversationListButton" onClick={this.props.onClick}>
        <img src={this.props.icon} />
        <div className="ConversationListButton-content">  
          <h3>{this.props.title}</h3>
        </div>
      </div>
    );
  }
}
