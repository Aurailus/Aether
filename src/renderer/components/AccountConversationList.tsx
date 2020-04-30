import * as React from 'react';
//@ts-ignore
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import './AccountConversationList.scss';

import { ChainListing } from '../../data/Chains';

import * as FormatDate from '../../util/FormatDate';

import { ConversationDateHeader } from './ConversationDateHeader';
import { AccountConversationListButton } from './AccountConversationListButton';
import { AccountConversationItem } from './AccountConversationItem';

const archiveIcon = require('../../../res/ico/icon-archived.svg');

interface Props {
    accountName: string;
    accountEmail: string;
    chains: ChainListing[];
    activeConv: number;
    convClicked: (message: ChainListing) => void;
}

export class AccountConversationList extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);

    this.convClicked = this.convClicked.bind(this);
    this.archivedClicked = this.archivedClicked.bind(this);
  }

  convClicked(ind: number) {
    this.props.convClicked(this.props.chains[ind]);
  }

  archivedClicked() {
    console.log('archived clicked');
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
      <ul className="AccountConversationList">
        <AccountConversationListButton
          key="__archived"
          title="Archived"
          icon={archiveIcon}
          onClick={this.archivedClicked}
        />
        {/*<AccountConversationListButton
          key="__boxes"
          title="Boxes"
          icon={folderIcon}
          onClick={this.boxesClicked}
        />*/}

        <ReactCSSTransitionGroup
          transitionName="AccountConversationList-transition"
          transitionEnterTimeout={200}
          transitionLeaveTimeout={200}
        >
          {this.props.chains.map((conv, ind) => {
            let date = new Date(conv.lastMessageDate);
            date!.setHours(0, 0, 0, 0);

            let header = this.getHeader(date, lastDate);
            lastDate = date;

            let returns: any[] = [];
            if (header) returns.push(<ConversationDateHeader key={new Date(conv.lastMessageDate).getTime()} header={header} />);
            returns.push((
              <AccountConversationItem
                key={ind}
                chain={conv}
                hasUnread={true}
                active={this.props.activeConv != -1 && this.props.chains[this.props.activeConv].id == conv.id}
                onClick={this.convClicked.bind(this, ind)}
              />  
            ));

            return returns;
          })}
        </ReactCSSTransitionGroup>
      </ul>
    );
  }
}
