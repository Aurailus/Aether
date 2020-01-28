import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import './AccountConversationList.scss';

import { BoxItem } from './BoxItem';
import { ImapBox } from '../../data/ImapBox';
import { BoxStructure } from '../BoxStructure';
import { MessageHeader } from '../../data/MessageHeader';
import { MessageConversation } from '../../data/MessageConversation';

import * as FormatDate from '../../util/FormatDate';

import { ConversationDateHeader } from './ConversationDateHeader';
import { AccountConversationListButton } from './AccountConversationListButton';
import { AccountConversationItem } from './AccountConversationItem';
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

export class AccountConversationList extends React.Component<Props, {}> {
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
      return FormatDate.months[date.getMonth()] + (date.getFullYear() != test.getFullYear() ? " " + date.getFullYear() : "");
    }

    return "";
  }

  render() {
    let lastDate: Date | null = null;

    return (
      <aside className="AccountConversationList">
        <div className="AccountConversationList-header">
          <h1>{this.props.accountName}</h1>
          <h2>{this.props.accountEmail}</h2>

          <LoadingSpinner 
            visible={this.props.conversations.length <= 0} 
            style={{position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px'}}
          />
        </div>

        <ul className="AccountConversationList-list">
          <AccountConversationListButton
            key="__archived"
            title="Archived"
            icon={archiveIcon}
            onClick={this.archivedClicked}
          />
          <AccountConversationListButton
            key="__boxes"
            title="Boxes"
            icon={folderIcon}
            onClick={this.boxesClicked}
          />

          <ReactCSSTransitionGroup
            transitionName="AccountConversationList-transition"
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
                <AccountConversationItem
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
