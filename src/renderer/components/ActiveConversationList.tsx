import * as React from 'react';

import './ActiveConversationList.scss';

import { MessageConversation } from '../../data/MessageConversation';

const styles = `
body {
  margin: 0;
  padding: 0;
  color: #fff;
}

body, p {
  line-height: 1.3em !important;
  font-family: "Roboto", sans-serif !important;
  font-size: 16px !important;
}`;

interface Props {
  conversation: MessageConversation
}

export class ActiveConversationList extends React.Component<Props, {}> {
  frame: any;

  componentDidMount() {
    if (this.frame != null) {
      console.log(this.props.conversation.contents[0]);
      this.frame.contentDocument.body.innerHTML = (this.props.conversation.contents[0].body.html || this.props.conversation.contents[0].body.textAsHtml) + "<style>" + styles + "</style>";
      this.frame.style.height = this.frame.contentWindow.document.documentElement.scrollHeight + "px";
    }
  }

  render() {
    return (
    <main className="ActiveConversationList">
      <iframe 
        ref={(iframe) => this.frame = iframe} 
        className="ActiveConversationList-messageFrame" 
        scrolling="no"
      />
    </main>
  );
  }
}
