import * as React from 'react';
import './Modal.scss';

export interface ModalProps {
    state: string;
    title: string;
    content: string;
    buttonConfirm?: { title: string; callback: any };
    buttonCancel?: { title: string; callback: any };
}

export class Modal extends React.Component<ModalProps, { visible: boolean }> {
    constructor(props: any) {
      super(props);

      this.state = {
        visible: false
    };

      setTimeout(() => {
        this.setState({ visible: true });
    }, 16);

      this.cancelPressed = this.cancelPressed.bind(this);
      this.confirmPressed = this.confirmPressed.bind(this);
  }

    cancelPressed() {
      if (this.props.buttonCancel && this.state.visible) {
        this.props.buttonCancel.callback();
        this.setState({ visible: false });
    }
  }

    confirmPressed() {
      if (this.props.buttonConfirm && this.state.visible) {
        this.props.buttonConfirm.callback();
        this.setState({ visible: false });
    }
  }

    render() {
      let state = 'info';
      if (this.props.state === 'success') state = 'success';
      if (this.props.state === 'error') state = 'error';

      let modalButtons = null;

      if (this.props.buttonConfirm || this.props.buttonCancel) {
        modalButtons = (
        <div className="Modal-button-wrap">
          {this.props.buttonCancel ? (
            <button onClick={this.cancelPressed}>{this.props.buttonCancel.title}</button>
          ) : null}
          {this.props.buttonConfirm ? (
            <button className="main" onClick={this.confirmPressed}>
              {this.props.buttonConfirm.title}
            </button>
          ) : null}
        </div>
      );
    }

      return (
      <div className={`Modal ${this.state.visible ? 'visible' : ''}`}>
        <div className={`Modal-box  ${state}`}>
          <div className="Modal-title-wrap">
            <h1>{this.props.title}</h1>
          </div>
          <div className="Modal-content-wrap">
            <p>{this.props.content}</p>
          </div>
          {modalButtons}
        </div>
      </div>
    );
  }
}
