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

	validate?: RegExp;
}

interface State {
	valid: boolean;
}

export class FormInput extends React.Component<Props, State> {
	input: HTMLElement | null = null;

	constructor(props: Props) {
		super(props);
		this.state = { valid: true };

		this.validate = this.validate.bind(this);
	}

	private validate() {
		if (this.input && this.props.validate) {
			this.setState({valid: !!(this.input as HTMLInputElement).value.match(this.props.validate) })
		}
	}

	render() {
		return (
			<div className={
				"FormInput " + 
				(this.props.fields[this.props.name] == "" ? "empty " : "notEmpty ") + 
				(this.state.valid ? " " : "invalid ") + (this.props.classes || "")}>

				<label className="FormInput-Label">{this.props.label}</label>
				<input ref={(i) => this.input = i}
					className="FormInput-Input"
					type={this.props.type} 
					value={this.props.fields[this.props.name]} 
					onChange={(e) => this.props.callback(this.props.name, e)}
					onBlur={this.validate}

					autoFocus={this.props.props.autoFocus} 
					maxLength={this.props.props.maxLength || 65535} />
			</div>
		);
	}
}
