import * as React from 'react';
const { ipcRenderer } = require('electron');

import './BoxItem.scss';
const iconExpand = require('../../../res/icon-add.svg');
const iconContract = require('../../../res/icon-subtract.svg');

import { ImapBox } from '../../data/ImapBox';

export interface BoxItemProps {
    name: string;
    icon: string;
    onClick: () => void;
    children: BoxItemProps[];
}

interface State {
    open: boolean;
}

export class BoxItem extends React.Component<BoxItemProps, State> {
    constructor(props: BoxItemProps) {
      super(props);

      this.state = {
        open: false
    };

      this.toggleOpen = this.toggleOpen.bind(this);
  }

    toggleOpen() {
      this.setState({ open: !this.state.open });
  }

    renderChildren(): JSX.Element[] {
      const elements: JSX.Element[] = [];

      for (const box of this.props.children) {
        elements.push(
        <BoxItem
          key={box.name}
          name={box.name}
          icon={box.icon}
          onClick={box.onClick}
          children={box.children}
        />
      );
    }

      return elements;
  }

    render() {
      return (
      <div className={`BoxItem ${this.state.open ? 'open' : ''}`}>
        <h3>
          <img className="BoxItem-icon" src={this.props.icon} />
          {this.props.name}
        </h3>
        <span className="BoxItem-unreadIndicator">9</span>
        {this.props.children.length > 0 && (
          <>
            <img
              className={`BoxItem-toggleOpen ${this.state.open ? 'open' : ''}`}
              onClick={this.toggleOpen}
              src={this.state.open ? iconContract : iconExpand}
            />
            <ul className="BoxItem-subList">{this.renderChildren()}</ul>
          </>
        )}
      </div>
    );
  }
}
