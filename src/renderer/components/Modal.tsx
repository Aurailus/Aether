import * as React from 'react';
import * as ReactDOM from 'react-dom'
import './Modal.scss';

const root = document.getElementsByTagName('body')[0];

interface Props {
  children: any;
  style: any;
}

export class Modal extends React.Component<Props, {}> {
  el: HTMLDivElement;

  constructor(props: Props) {
    super(props);
    this.el = document.createElement('div');
    this.el.classList.add('Modal');
  }

  componentDidMount() {
    root.appendChild(this.el);
  }

  componentWillUnmount() {
    root.removeChild(this.el);
  }

  render() {
    for (let key in this.props.style) {
      //@ts-ignore
      this.el.style[key] = this.props.style[key];
    }
    
    return ReactDOM.createPortal(
      this.props.children,
      this.el
    );
  }
}
