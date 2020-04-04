import * as React from 'react';

import './MessageFrame.scss';

import { FormatDate } from '../../util/FormatDate';
import { Message } from '../../data/Message';

const style = require('!css-loader!sass-loader!./MessageFrameStyleInner.scss').toString();
const convIcon = require('../../../res/all-mail.svg');

//@ts-ignore
import Turndown from "turndown";
import Marked from "marked";

interface Props {
  message: Message
}

// interface NodeData {
//   par: string,
//   val: string 
// }

export class MessageFrame extends React.Component<Props, {}> {
  frame: HTMLIFrameElement | null = null;
  observer: any;

  // static ALLOWED_TAGS = [
  //   "span", "p", "a", "div", 
  //   "strong", "b", "em", "i", 
  //   "h1", "h2", "h3", "h4", "h5", "h6"];

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
      const service = new Turndown();
      let md = service.turndown(this.props.message.body.body);

      console.log(md);

      // Strip history using format 'From: Name [Email]'
      md = md.replace(/(\*\*)?From:(\*\*)? ?[\w@. ]+ ?\\?\[?.+\]?(.|\n)*$/gm, '');
      // Strip history using format 'On 0000-00-00 00:00 a.m., Name|Email wrote:'
      md = md.replace(/On \d{2,4}-\d{2}-\d{2} \d{1,2}:\d{2} ?((a|p).?m.?)?,? ?.+ ?wrote:?(.|\n)*$/gm, '');
      // Strip history using format 'On Wed, Mar 00, 0000 at 0:00 AM -0700, "Name" <email> wrote:'
      md = md.replace(/On \w+[, ]*\w+[, ]*\d{1,2}[, ]*\d{2,4}( at |, *)\d{1,2}:\d{1,2}( (A|P)M )?-?\d*[, ]*["']?[\w ]+["']? ?<.+> ?wrote:?(.|\n)*$/gm, '');

      let html = Marked(md);

      // const dom = document.createElement('div');
      // dom.innerHTML = this.props.message.body.body;

      // console.log(Turndown);

      // let textContent: NodeData[] = [];

      // // Discover elements
      // let discoverTextContent = (node: Node) => {
      //   if (node.nodeName == "#text") {
      //     const par = (node.parentNode?.nodeName || "").toLowerCase().trim();

      //     let val: string = (node.nodeValue || "").trim();
      //     val = val.trim();
      //     val = val.replace(/\*/g, '\*');
      //     val = val.replace(/\_/g, '\_');

      //     textContent.push({par: par, val: val});
      //   }
      //   node.childNodes.forEach((child) => discoverTextContent(child));
      // }

      // const body = dom.querySelector('body') || dom;
      // discoverTextContent(body);

      // // Prune elements
      // textContent = textContent.filter((e) => {
      //   // Remove empty divs.

      //   if (!MessageFrame.ALLOWED_TAGS.includes(e.par)) {
      //     // console.log(e.par);
      //     return false;
      //   }

      //   if (e.par == "div" && e.val.trim() == "") return false;
      //   return true;
      // });

      // // Add Markdown semantics
      // textContent = textContent.map((e): NodeData => {
      //   let wrap = "";
        
      //   if (e.val.trim() != "") {
      //     if (e.par == "b" || e.par == "strong") wrap = "**"; // Bold
      //     else if (e.par == "i" || e.par == "em") wrap = "_"; // Italics
      //   }

      //   return {par: e.par, val: wrap + e.val + wrap};
      // })



      // console.log(textContent);
      // body.childNodes.forEach((n) => console.log(n.nodeName, n));






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

      let message = html;
      message += "<style>" + style + "</style>";

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
