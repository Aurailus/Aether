import * as React from 'react';

import './AccountConversationListButton.scss';

export interface ConversationListButtonProps {
    title: string,
    icon: any
    onClick: () => void;
}

export class AccountConversationListButton extends React.Component<ConversationListButtonProps, {}> {
  constructor(props: ConversationListButtonProps) {
    super(props);
  }

  render() {
    return (
      <div className="AccountConversationListButton" onClick={this.props.onClick}>
        <img src={this.props.icon} />
        <div className="AccountConversationListButton-content">  
          <h3>{this.props.title}</h3>
        </div>
      </div>
    );
  }
}
