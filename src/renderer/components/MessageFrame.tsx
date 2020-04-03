import * as React from 'react';

import './MessageFrame.scss';

import { FormatDate } from '../../util/FormatDate';

import { Message } from '../../data/Message';

interface Props {
  message: Message
}

const convIcon = require('../../../res/all-mail.svg');

const styles = `
body {
  margin: 0;
  padding: 0;
  color: #bbb;
}

body, p, p *, div, ol li, ul li {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Fira Sans', 'Helvetica Neue', sans-serif !important;
  font-size: 16px !important;
  color: #bbb !important;

  margin: 0 0 0.4em 0 !important;
  line-height: 1.2em !important;
  
  word-wrap: break-word !important;
  word-break: break-word !important;
  text-align: left !important;
}

ul, ol {
  padding-left: 16px !important;
}

a, a:link {
  color: #80abeb !important;
  text-decoration: underline !important;
}

a:focus {
  color: #a1c0f0 !important;
}

a:hover {
  color: #a7c5f2 !important;
}

a:active {
  color: #b4c8e6 !important;
}

hr {
  display: none !important;
}

/* Outlook Style Overrides */
div[class^="WordSection"] > p.MsoNormal:empty, div[class^="WordSection"] > p.MsoNormal > span, div[class^="WordSection"] > li.MsoListParagraph {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Fira Sans', 'Helvetica Neue', sans-serif !important;
  font-size: 16px !important;
  color: #bbb !important;

  margin: 0 0 0.4em 0 !important;
  line-height: 1.2em !important;
  
  word-wrap: break-word !important;
  word-break: break-word !important;
  text-align: left !important;
}
`;

export class MessageFrame extends React.Component<Props, {}> {
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
      let message = this.props.message.body.body;
      // let toNamesSeperated = this.props.message.header.recipients.replace(/ /g, "|").replace(/[\|]+$/, "");
      // let fromNamesSeperated = this.props.message.header.senders.replace(/ /g, "|").replace(/[\|]+$/, "");;

      // /* Regex to strip introduction from the message.
      // *
      // *  \>                                                               - Catch a tag so that we know that the statement is at the beginning of a paragraph
      // *  (Hey|Hello|Hi) +                                                 - some sort of greeting followed by one or more spaces.
      // *  (there|everyone|everybody|guys|gals|girls|dudes|people|friends)? - zero or one additional specifier.  
      // *  [\.,: ]*                                                         - Trailing punctuation characters (comma, period, colon)
      // *  .*?                                                              - Following characters until first instance of closing tag
      // *  (?=\<\/.+\>)                                                     - Forward lookahead for a closing tag
      // */
      // let re = new RegExp(`/\>((Hey|Hello|Hi|${toNamesSeperated}) +` +
      //   `(there|everyone|everybody|guys|gals|girls|dudes|people|friends|${toNamesSeperated})?[\.,:! \n]*).*?(?=\<\/.+\>)/im`);

      // message = message.replace(re, ">");

      //  Regex to strip signature from the message.
      // *
      // *  \>                         - Catch a tag so that we know that the statement is at the beginning of a paragraph
      // *  (thanks|thank you|best) ...- some sort of signature / conclusion
      // *  [\.,: ]*                   - zero or more whitespace / punctuation characters
      // *  (?=(\<[^\/]*\>)*?\<\/.+\>) - Following lookahead through only tags until a closing tag
      // *  .+                         - Collect everything else to cut the rest of the message
      
      // re = new RegExp(`/\>((-|thanks|thank|best|kind|regards|${fromNamesSeperated}) *` +
      //   `(kindly|you so much|so much|you|regards|again|${fromNamesSeperated})*[\.,:! \n]*)(?=(\<[^\/]*\>)*?\<\/.+\>).+/gims`);

      // message = message.replace(re, ">");

      // // Strip double-spaces... why do people still do this?
      // message = message.replace(/(\&nbsp;| ){2,}(?=[\w\.,:])/ig, " ");

      // // Close all open tags
      // let div = document.createElement('div');
      // div.innerHTML = message;

      // // Remove 'empty' paragraph tags
      // div.querySelectorAll('p').forEach((elem) => {
      //   if ((elem.textContent || "").trim() == "") elem.remove();
      // });

      // // Remove blank BR divs / paras / whatever
      // div.querySelectorAll('br').forEach((elem) => {
      //   if (elem.parentElement!.textContent!.trim() == "") {
      //     elem.remove();
      //   }
      // })

      // // Remove signature element (if it exists)
      // let sig = div.querySelector('#signature, #Signature, #SIGNATURE, .ms-outlook-ios-signature');
      // if (sig != null) {
      //   while (sig.nextElementSibling != null) {
      //     sig.nextElementSibling.remove();
      //   }
      //   sig.remove();
      // }

      // // Remove previous message element (Outlook Mobile)
      // div.querySelectorAll('hr + #divRplyFwdMsg, #divRplyFwdMsg, #divRplyFwdMsg ~ *').forEach(e => e.remove());

      // message = div.innerHTML;

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
    <main className="MessageFrame">
      <img className="MessageFrame-icon" src={convIcon} />
      <div>
        <p className="MessageFrame-details">
          <span className="MessageFrame-sender">{this.props.message.header.senders}</span>
          <span className="MessageFrame-sent">
            {FormatDate(new Date(this.props.message.header.date)).replace(/^\w/, c => c.toUpperCase())}
          </span>
        </p>
        <iframe className="MessageFrame-iframe"
          ref={(iframe) => this.frame = iframe} 
          scrolling="no"
        />
      </div>
    </main>
  );
  }
}
