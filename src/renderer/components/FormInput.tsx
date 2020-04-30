import * as React from 'react';

import './FormInput.scss';

interface Props {
	type: string;
	classes?: string;
	label: string;
	name: string;
	fields: any;
	callback: (name: string, e: any) => void,
	props: { maxLength?: number; autoFocus?: boolean };
}

export class FormInput extends React.Component<Props, {}> {
	render() {
		return (
			<div className={"FormInput " + (this.props.fields[this.props.name] == "" ? "empty" : "notEmpty") + " " + (this.props.classes || "")}>
				<label className="FormInput-Label">{this.props.label}</label>
				<input
					className="FormInput-Input"
					type={this.props.type} 
					value={this.props.fields[this.props.name]} 
					onChange={(e) => this.props.callback(this.props.name, e)} 

					autoFocus={this.props.props.autoFocus} 
					maxLength={this.props.props.maxLength || 65535} />
			</div>
		);
	}
}
