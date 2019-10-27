import * as React from 'react';

import './BoxList.scss';

const convsIcon = require('../../../res/icon-user-group.svg');
const convIcon = require('../../../res/icon-user-circle.svg');
const archiveIcon = require('../../../res/icon-box.svg');
const folderIcon = require('../../../res/icon-folder-remove.svg');
const sentIcon = require('../../../res/icon-inbox-upload.svg');
const inboxIcon = require('../../../res/icon-mail.svg');
const importantIcon = require('../../../res/icon-target.svg');
const trashIcon = require('../../../res/icon-archive.svg');
const draftIcon = require('../../../res/icon-document-notes.svg');
const spamIcon = require('../../../res/icon-security.svg');
const starredIcon = require('../../../res/icon-star.svg');

import { ImapBox } from '../../data/ImapBox';
import { BoxStructure } from '../BoxStructure';
import { BoxItem } from './BoxItem';

interface Props {
    accountName: string;
    accountEmail: string;
    boxes: BoxStructure;
}

// let icon = folderIcon;

// if (this.props.box.name == "Important") icon = importantIcon;

// if 			(this.props.box.attribs.includes("\\All") || this.props.box.attribs.includes("\\Archive")) icon = archiveIcon;
// else if (this.props.box.attribs.includes("\\Trash")) icon = trashIcon;
// else if (this.props.box.attribs.includes("\\Sent")) icon = sentIcon;
// else if (this.props.box.attribs.includes("\\Junk")) icon = spamIcon;
// else if (this.props.box.attribs.includes("\\Drafts")) icon = draftIcon;
// else if (this.props.box.attribs.includes("\\Flagged")) icon = starredIcon;
// else if (this.props.box.attribs.includes("\\Inbox")) icon = inboxIcon;

// this.state = {
// 	open: false,
// 	icon: icon
// };

export class BoxList extends React.Component<Props, {}> {
    constructor(props: Props) {
      super(props);

      this.convClicked = this.convClicked.bind(this);
  }

    convClicked() {
      console.log('owo');
  }

    render() {
      return (
      <aside className="BoxList">
        <div className="BoxList-header">
          <h1>{this.props.accountName}</h1>
          <h2>{this.props.accountEmail}</h2>
        </div>

        <ul className="BoxList-list">
          <BoxItem
            key="conversations"
            name="Conversations"
            icon={convsIcon}
            onClick={this.convClicked}
            children={[
                {
                    name: 'Nicole Collings',
                    icon: convIcon,
                    onClick: this.convClicked.bind(this),
                    children: []
                },
                {
                    name: 'Jason Coombs',
                    icon: convIcon,
                    onClick: this.convClicked.bind(this),
                    children: []
                },
                {
                    name: 'Jesse Crisp',
                    icon: convIcon,
                    onClick: this.convClicked.bind(this),
                    children: []
                },
                {
                    name: 'Delta Delta',
                    icon: convIcon,
                    onClick: this.convClicked.bind(this),
                    children: []
                }
            ]}
          />
        </ul>
      </aside>
    );
  }
}
