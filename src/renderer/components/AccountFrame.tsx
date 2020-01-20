import * as React from 'react';
const { ipcRenderer } = require('electron');

import './AccountFrame.scss';

import { ALL_ACCOUNT_ID } from './App';
import { BoxList } from './BoxList';
import { ConversationList } from './ConversationList';
import { AccountProps } from '../../data/AccountProps';
import { ImapBox } from '../../data/ImapBox';
import { BoxStructure } from '../BoxStructure';

interface Props {
    account: AccountProps;
}

interface State {
    boxes: BoxStructure;
}

export class AccountFrame extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { boxes: new BoxStructure({}) };
    ipcRenderer.on('account-boxes', (event: Electron.IpcMessageEvent, boxes: { [key: string]: ImapBox }) => this.handleAccountBoxes(boxes));
  }

  handleAccountBoxes(boxes: { [key: string]: ImapBox }) {
    const boxStructure = new BoxStructure(boxes);
    this.setState({ boxes: boxStructure });
  }

  render() {
    return (
      <div className="AccountFrame">
        <BoxList
          accountName={this.props.account.name}
          accountEmail={this.props.account.email}
          boxes={this.state.boxes}
        />
        <ConversationList />
      </div>
    );
  }
}
