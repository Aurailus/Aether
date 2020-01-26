import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import './ConversationList.scss';

import { BoxItem } from './BoxItem';
import { ImapBox } from '../../data/ImapBox';
import { BoxStructure } from '../BoxStructure';
import { MessageHeader } from '../../data/MessageHeader';
import { MessageConversation } from '../../data/MessageConversation';

import { ConversationDateHeader } from './ConversationDateHeader';
import { ConversationListButton } from './ConversationListButton';
import { ConversationItem } from './ConversationItem';
import { LoadingSpinner } from './LoadingSpinner';

// const convsIcon = require('../../../res/icon-user-group.svg');
// const convIcon = require('../../../res/icon-user-circle.svg');
const archiveIcon = require('../../../res/icon-box.svg');
const folderIcon = require('../../../res/icon-folder-remove.svg');
// const sentIcon = require('../../../res/icon-inbox-upload.svg');
// const inboxIcon = require('../../../res/icon-mail.svg');
// const importantIcon = require('../../../res/icon-target.svg');
// const trashIcon = require('../../../res/icon-archive.svg');
// const draftIcon = require('../../../res/icon-document-notes.svg');
// const spamIcon = require('../../../res/icon-security.svg');
// const starredIcon = require('../../../res/icon-star.svg');


interface Props {
    accountName: string;
    accountEmail: string;
    conversations: MessageConversation[];
    activeConversation: MessageConversation | null;
    convClicked: (message: MessageConversation) => void;
}

export class ConversationList extends React.Component<Props, {}> {
  private monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  constructor(props: Props) {
    super(props);

    this.convClicked = this.convClicked.bind(this);
    this.archivedClicked = this.archivedClicked.bind(this);
    this.boxesClicked = this.boxesClicked.bind(this);
  }

  convClicked(ind: number) {
    this.props.convClicked(this.props.conversations[ind]);
  }

  archivedClicked() {
    console.log('archived clicked');
  }

  boxesClicked() {
    console.log('boxes clicked');
  }


  private addSuffixToNumber(i: number) {
    let j = i % 10, k = i % 100;
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
  }

  private getHeader(date: Date, lastDate: Date | null): string {
    let test = new Date();
    test.setHours(0, 0, 0, 0);

    if (+test == +date && (!lastDate || +test != +lastDate)) return "Today";

    test.setDate(test.getDate() - 1);
    if (+test == +date && (!lastDate || +test != +lastDate)) return "Yesterday";

    test.setDate(test.getDate() - 1);
    if (+test >= +date && (!lastDate || +test < +lastDate)) return "This Week";

    test.setDate(test.getDate() + 2);
    test.setDate(test.getDate() - test.getDay());
    if (+test >= +date && (!lastDate || +test < +lastDate)) return "This Month";

    test = new Date();
    test.setHours(0, 0, 0, 0);
    let dateMonth = date.getMonth() + date.getFullYear()*12;
    
    if (!lastDate || lastDate.getMonth() + lastDate.getFullYear()*12 > dateMonth) {
      return this.monthNames[date.getMonth()] + (date.getFullYear() != test.getFullYear() ? " " + date.getFullYear() : "");
    }

    return "";
  }

  render() {
    let lastDate: Date | null = null;

    return (
      <aside className="ConversationList">
        <div className="ConversationList-header">
          <h1>{this.props.accountName}</h1>
          <h2>{this.props.accountEmail}</h2>

          <LoadingSpinner 
            visible={this.props.conversations.length <= 0} 
            style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}}
          />
        </div>

        <ul className="ConversationList-list">
          <ConversationListButton
            key="__archived"
            title="Archived"
            icon={archiveIcon}
            onClick={this.archivedClicked}
          />
          <ConversationListButton
            key="__boxes"
            title="Boxes"
            icon={folderIcon}
            onClick={this.boxesClicked}
          />

          <ReactCSSTransitionGroup
            transitionName="ConversationList-transition"
            transitionEnterTimeout={200}
            transitionLeaveTimeout={200}
          >
            {this.props.conversations.map((conv, ind) => {
              let date = new Date(conv.headers[0].date);
              date!.setHours(0, 0, 0, 0);

              let header = this.getHeader(date, lastDate);
              lastDate = date;

              let returns: any[] = [];
              if (header) returns.push(<ConversationDateHeader key={new Date(conv.headers[0].date).getTime()} header={header} />);
              returns.push((
                <ConversationItem
                  key={ind}
                  conversation={conv}
                  hasUnread={true}
                  active={this.props.activeConversation != null && this.props.activeConversation.headers.length > 0 
                    && this.props.activeConversation.headers[0].uid == conv.headers[0].uid}
                  onClick={this.convClicked.bind(this, ind)}
                />  
              ));

              return returns;
            })}
          </ReactCSSTransitionGroup>
        </ul>
      </aside>
    );
  }
}
