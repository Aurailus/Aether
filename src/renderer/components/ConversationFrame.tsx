import * as React from 'react';

import './ConversationFrame.scss';

import { FormatDate } from '../../util/FormatDate';

import { MessageHeader } from '../../data/MessageHeader';
import { MessageContents } from '../../data/MessageContents';

interface Props {
  header: MessageHeader,
  content: MessageContents
}

const convIcon = require('../../../res/all-mail.svg');

const styles = `
body {
  margin: 0;
  padding: 0;
  color: #ccc;
}

body, p {
  font-family: "Roboto", sans-serif !important;
  font-size: 16px !important;
  color: #ccc !important;

  margin: 0 0 0.4em 0 !important;
  line-height: 1.2em !important;
}

/* Outlook Style Overrides */

div[class^="WordSection"] > p.MsoNormal {
  word-wrap: break-word !important;
  word-break: break-word !important;
  text-align: left !important;
}
`;

export class ConversationFrame extends React.Component<Props, {}> {
  frame: HTMLIFrameElement | null = null;
  observer: any;

  constructor(props: Props) {
    super(props);
    this.setComponentHeight = this.setComponentHeight.bind(this);
  }

  private setComponentHeight() {
    let elem: HTMLElement | null = this.frame!.contentWindow!.document.body.lastElementChild as HTMLElement;
    while (elem != null && elem.offsetHeight == 0) elem = elem.previousElementSibling as HTMLElement;
    if (elem == null) elem = this.frame!.contentWindow!.document.body || this.frame!.contentWindow!.document.documentElement;
    
    this.frame!.style.height = (elem.offsetHeight + elem.offsetTop + 10) + "px";
  }

  componentDidMount() {
    if (this.frame != null) {
      let message = this.props.content.body.html || this.props.content.body.textAsHtml;

      console.log(message);

      /* Regex to strip introduction from the message.
      *
      *  \>                                                               - Catch a tag so that we know that the statement is at the beginning of a paragraph
      *  (Hey|Hello|Hi) +                                                 - some sort of greeting followed by one or more spaces.
      *  (there|everyone|everybody|guys|gals|girls|dudes|people|friends)? - zero or one additional specifier.  
      *  [\.,: ]*                                                         - Trailing punctuation characters (comma, period, colon)
      *  .*?                                                              - Following characters until first instance of closing tag
      *  (?=\<\/.+\>)                                                     - Forward lookahead for a closing tag
      */
      message = message.replace(/\>((Hey|Hello|Hi) +(there|everyone|everybody|guys|gals|girls|dudes|people|friends)?[\.,: ]*).*?(?=\<\/.+\>)/im, ">");

      /* Regex to strip signature from the message.
      *
      *  \>                         - Catch a tag so that we know that the statement is at the beginning of a paragraph
      *  (thanks|thank you|best) ...- some sort of signature / conclusion
      *  [\.,: ]*                   - zero or more whitespace / punctuation characters
      *  (?=(\<[^\/]*\>)*?\<\/.+\>) - Following lookahead through only tags until a closing tag
      *  .+                         - Collect everything else to cut the rest of the message
      */
      message = message.replace(/\>((thanks|thank|best) *(kindly|you so much|you)*[\.,: ]*)(?=(\<[^\/]*\>)*?\<\/.+\>).+/gims, ">");

      // Strip double-spaces... why do people still do this?
      message = message.replace(/(\&nbsp;| ){2,}(?=[\w\.,:])/ig, " ");

      // Close all open tags
      let div = document.createElement('div');
      div.innerHTML = message;

      // Remove 'empty' paragraph tags
      div.querySelectorAll('p').forEach((elem) => {
        if ((elem.textContent || "").trim() == "") elem.remove();
      });

      message = div.innerHTML;

      // Append style information
      message += "<style>" + styles + "</style>";

      this.frame.contentDocument!.body.innerHTML = message;
    }

    window.addEventListener('resize', this.setComponentHeight);
    this.setComponentHeight();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setComponentHeight);
  }

  render() {
    return (
    <main className="ConversationFrame">
      <img className="ConversationFrame-icon" src={convIcon} />
      <div>
        <p className="ConversationFrame-details">
          <span className="ConversationFrame-sender">{this.props.header.from}</span>
          <span className="ConversationFrame-sent">{FormatDate(new Date(this.props.header.date)).replace(/^\w/, c => c.toUpperCase())}</span>
        </p>
        <iframe className="ConversationFrame-iframe"
          ref={(iframe) => this.frame = iframe} 
          scrolling="no"
        />
      </div>
    </main>
  );
  }
}
