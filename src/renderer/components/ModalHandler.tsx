// import * as React from 'react';
// import './ModalHandler.scss';
// import {Modal} from './Modal'

// interface ModalHandlerState {
// 	modals: JSX.Element[];
// };

// export class ModalHandler extends React.Component<{}, ModalHandlerState> {
// 	constructor(props: any) {
// 		super(props);

// 		this.state = {
// 			modals: []
// 		}
// 	}

// 	closeModal() {}

// 	createModal(type: string = "info", title: string, content: string, confirmText?: string, cancelText?: string) : Promise<null> {
// 		return new Promise((resolve, reject) => {
// 			const modal: JSX.Element = (<Modal
// 	    	state={type}
// 	    	title={title}
// 	    	content={content}
// 	      buttonConfirm={(confirmText) ? {title: confirmText, callback: () => {this.closeModal(); resolve()}} : undefined}
// 	      buttonCancel={(cancelText) ? {title: cancelText, callback: () => {this.closeModal(); reject()}} : undefined}
// 	  	/>);

// 	  	const modals = this.state.modals.concat([modal]);
// 	  	this.setState({modals: modals});
// 		});
//   }

//   render() {
//  		if (this.state.modals.length > 0) {
//  			return (<div className="ModalHandler-wrap">{this.state.modals[this.state.modals.length - 1]}</div>);
//  		}
//   }
// }
