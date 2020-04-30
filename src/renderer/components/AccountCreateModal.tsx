import * as React from 'react';

import './AccountCreateModal.scss';

import { FormInput } from './FormInput'

const nextButton = require('../../../res/ico/icon-next.svg');

interface Props {
}

interface State {
	fields: {
		name: string;
		email: string;
		password: string;

		imap_user: string;
		imap_host: string;
		imap_port: string;

		smtp_user: string;
		smtp_host: string;
		smtp_port: string;
	}

	stage: number;
}

export class AccountCreateModal extends React.Component<Props, State> {
	elem: HTMLElement | null = null;

	constructor(props: Props) {
		super(props);
		this.state = { 
			fields: { 
				name: "", 
				email: "", 
				password: "",

				imap_user: "", 
				imap_host: "", 
				imap_port: "993",

				smtp_user: "", 
				smtp_host: "", 
				smtp_port: "587" 
			}, 
			stage: 0 
		};

    this.handleChange = this.handleChange.bind(this);
    this.formForward = this.formForward.bind(this);
    this.formBack = this.formBack.bind(this);
	}

	componentWillUpdate() {
  	setTimeout(() => this.updateHeight(), 0);
	}
  
  componentDidMount() {
  	setTimeout(() => this.updateHeight(), 0);
  }

  private updateHeight() {
    console.log('height');
    if (this.elem == null) return;
    let lowest = this.elem.children[this.elem.children.length - 1] as HTMLElement;
    this.elem.style.height = (Math.round((lowest.clientHeight + lowest.offsetTop) / 2) * 2) + "px";
  }

	handleChange(name: string, e: any) {
		let fields = Object.assign({}, this.state.fields) as any;
		fields[name] = e.target.value;
		this.setState({fields: fields});
	}

	formForward(e: any): boolean {
		let fields = Object.assign({}, this.state.fields) as any;
		if (fields.imap_user == "") fields.imap_user = fields.email;
		if (fields.smtp_user == "") fields.smtp_user = fields.email;

		this.setState({fields: fields, stage: this.state.stage + 1});
		

		e.preventDefault();
		return false;
	}

	formBack(e: any): boolean {
		this.setState({stage: this.state.stage - 1});

		e.preventDefault();
		return false;
	}

	render() {
		let filled = 
			(this.state.stage == 0) ? 
				this.state.fields.name != "" && this.state.fields.email != "" && this.state.fields.password != "" :
			(this.state.stage == 1) ?
				this.state.fields.imap_host != "" && this.state.fields.imap_user != "" && this.state.fields.imap_port != "" && parseInt(this.state.fields.imap_port) != NaN && 
				this.state.fields.smtp_host != "" && this.state.fields.smtp_user != "" && this.state.fields.smtp_port != "" && parseInt(this.state.fields.smtp_port) != NaN :
			false

		return (
			<div className="AccountCreateModal" ref={(e) => this.elem = e}>
				<h1>Add Account</h1>
				<p>The first step to improving your life with Aether.</p>

				<form onSubmit={this.formForward}>

					{this.state.stage == 0 && <>
						<FormInput
							type="text" label="Name" name="name"
							fields={this.state.fields} callback={this.handleChange}
							props={{ autoFocus: true, maxLength: 64 }} />

						<FormInput
							type="text" label="Email Address" name="email"
							fields={this.state.fields} callback={this.handleChange}
							props={{ maxLength: 128 }} />

						<FormInput
							type="password" label="Password" name="password"
							fields={this.state.fields} callback={this.handleChange}
							props={{ maxLength: 64 }} />
					</>}

					{this.state.stage == 1 && <>

						<FormInput
							type="text" label="IMAP Username" name="imap_user"
							fields={this.state.fields} callback={this.handleChange}
							props={{ autoFocus: true, maxLength: 128 }} />

						<FormInput
							type="text" classes="inl-70-pad" label="IMAP Host" name="imap_host"
							fields={this.state.fields} callback={this.handleChange}
							props={{ maxLength: 128 }} />

						<FormInput
							type="text" classes="inl-30" label="IMAP Port" name="imap_port"
							fields={this.state.fields} callback={this.handleChange}
							props={{ maxLength: 5 }} />

						<hr/>

						<FormInput
							type="text" label="SMTP Username" name="smtp_user"
							fields={this.state.fields} callback={this.handleChange}
							props={{ autoFocus: true, maxLength: 128 }} />

						<FormInput
							type="text" classes="inl-70-pad" label="SMTP Host" name="smtp_host"
							fields={this.state.fields} callback={this.handleChange}
							props={{ maxLength: 128 }} />

						<FormInput
							type="text" classes="inl-30" label="SMTP Port" name="smtp_port"
							fields={this.state.fields} callback={this.handleChange}
							props={{ maxLength: 5 }} />
					</>}

					<div className="AccountCreateModal-FormNavWrap">
						{this.state.stage > 0 && <button className="AccountCreateModal-FormButton back" onClick={this.formBack}>
							Back
						</button>}

						<button className={"AccountCreateModal-FormButton submit"} disabled={!filled} onMouseOver={() => this.showErrors(true)} onMouseOut={() => this.showErrors(false)}>
							{this.state.stage == 1 ? "Test" : "Next"}
							<img src={nextButton}/>
						</button>
					</div>
				</form>
			</div>
		);
	}
}
