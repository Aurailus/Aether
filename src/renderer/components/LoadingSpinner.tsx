import * as React from 'react';
import './LoadingSpinner.scss';

export class LoadingSpinner extends React.Component<{visible: boolean, style: React.CSSProperties}, {}> {
  render() {
    return (
    	<div className={"LoadingSpinner" + (this.props.visible ? " visible" : "")} style={this.props.style}>
    		<div className="LoadingSpinner-bounce1" />
    		<div className="LoadingSpinner-bounce2" />
    	</div>
    );
	}
}
