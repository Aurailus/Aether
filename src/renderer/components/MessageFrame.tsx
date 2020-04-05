import * as React from 'react';

import './MessageFrame.scss';

import { FormatDate } from '../../util/FormatDate';
import { Message } from '../../data/Message';

const style = require('!css-loader!sass-loader!./MessageFrameStyleInner.scss').toString();
const convIcon = require('../../../res/all-mail.svg');

import Turndown from "turndown";
import Marked from "marked";

interface Props {
  message: Message
}

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
      const service = new Turndown();
      let md = service.turndown(this.props.message.body.body);

      // Strip history using format 'From: Name [Email]'
      md = md.replace(/(\*\*)?From:(\*\*)? ?[\w@. ]+ ?\\?\[?.+\]?(.|\n)*$/gm, '');
      // Strip history using format 'On 0000-00-00 00:00 a.m., Name|Email wrote:'
      md = md.replace(/On \d{2,4}-\d{2}-\d{2} \d{1,2}:\d{2} ?((a|p).?m.?)?,? ?.+ ?wrote:?(.|\n)*$/gm, '');
      // Strip history using format 'On Wed, Mar 00, 0000 at 0:00 AM -0700, "Name" <email> wrote:'
      md = md.replace(/On \w+[, ]*\w+[, ]*\d{1,2}[, ]*\d{2,4}( at |, *)\d{1,2}:\d{1,2}( (A|P)M )?-?\d*[, ]*["']?[\w ]+["']? ?<.+> ?wrote:?(.|\n)*$/gm, '');

      let html = Marked(md);

      this.frame.contentDocument!.body.innerHTML = html + "\n<style>" + style + "</style>";
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
