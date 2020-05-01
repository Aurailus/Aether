import * as React from 'react';

import "./AccountCreateModal.scss";

import { FormManager } from "../FormManager"
import { LoadingSpinner } from "./LoadingSpinner"

import { SerializedAccount } from "../../data/SerializedAccount"
import { ImapBox } from '../../main/declarations/ImapBox'

const { ipcRenderer } = require('electron');

interface State {
	error: string;
}

export class AccountCreateModal extends React.Component<{}, State> {
	elem: HTMLElement | null = null;
	form: FormManager;

	constructor(props: any) {
		super(props);

		this.state = { error: "" }

		this.handleTestResult = this.handleTestResult.bind(this);

		this.form = new FormManager({
			update: () => this.forceUpdate(),
		}, [{
			fields: [
				{name: "name", label: "Name", props: {maxLength: 64}, validate: "NotEmpty", default: "Nicole"},
				{name: "email", label: "Email", props: {maxLength: 128}, validate: "Email", default: "me@auri.xyz"},
				{name: "password", type: "password", label: "Password", validate: "NotEmpty"},
			],
			nav: {
				next: "Next",
				onNext: (form: FormManager) => {
					if (form.fields.imap_user == "") form.fields.imap_user = form.fields.email;
					if (form.fields.smtp_user == "") form.fields.smtp_user = form.fields.email;
				}
			}
		}, {
			fields: [
				{name: "imap_user", label: "IMAP User", validate: "NotEmpty", default: "me@auri.xyz"},
				{name: "imap_host", label: "IMAP Host", display: "inl-70 pad", validate: "URL", default: "mail.hover.com"},
				{name: "imap_port", label: "IMAP Port", display: "inl-30", props: {maxLength: 5}, default: "993", validate: "Number"},

				{type: "HR"},
				
				{name: "smtp_user", label: "SMTP User", validate: "NotEmpty", default: "me@auri.xyz"},
				{name: "smtp_host", label: "SMTP Host", display: "inl-70 pad", validate: "URL", default: "mail.hover.com"},
				{name: "smtp_port", label: "SMTP Port", display: "inl-30", props: {maxLength: 5}, default: "587", validate: "Number"},
			],
			nav: {
				previous: "Back",
				next: "Test",
				onNext: (form) => {
					this.setState({ error: "" });
			    ipcRenderer.send('test-account', {
			    	imap_host: form.fields.imap_host,
					  imap_user: form.fields.imap_user,
					  imap_port: form.fields.imap_port,
					  password: form.fields.password,
					} as SerializedAccount);
				}
			}
		}, {
			raw: <>
				<div style={{display: "block", height: "64px"}} />
				<LoadingSpinner visible={true} style={{left: "50%", transform: "translateX(-50%)"}}/>
				<p style={{opacity: 0.7, textAlign: "center", marginTop: "16px", fontSize: "16px"}}>Attempting to connect to the server,<br/>&nbsp;&nbsp;&nbsp;Please wait...</p>
				<div style={{display: "block", height: "16px"}} />
			</>,
			nav: {
				previous: "Cancel",
				onPrevious: () => {
					ipcRenderer.send('test-cancel');
				}
			}
		}, {
			fields: [
				{name: "box_sent", type: "boxlist", label: "Sent Box"},
				{name: "box_archive", type: "boxlist", label: "Archive Box"}
			],
			nav: {
				previous: "Back",
				onPrevious: (form) => form.formBack(null, false)
			}
		}])
	}

	componentWillUpdate() { 
		setTimeout(() => this.updateHeight(), 0); 
	}

  componentDidMount() { 
  	setTimeout(() => this.updateHeight(), 0);
  	ipcRenderer.on('test-result', this.handleTestResult);
  }

  componentWillUnmount() {
  	ipcRenderer.off('test-result', this.handleTestResult);
  }

  private handleTestResult(_: any, success: boolean, v: string | {[key: string]: ImapBox}) {
  	if (!success) {
  		this.setState({error: v as string});
  		this.form.formBack();
  		return;
  	}
  	else {
  		this.form.formForward();
  		this.form.pages[3].fields![0].boxes = v as {[key: string]: ImapBox};
  		this.form.pages[3].fields![1].boxes = v as {[key: string]: ImapBox};
  		this.forceUpdate();
  	}
  }

  private updateHeight() {
    if (this.elem == null) return;
    let lowest = this.elem.children[this.elem.children.length - 1] as HTMLElement;
    this.elem.style.height = (Math.round((lowest.clientHeight + lowest.offsetTop) / 2) * 2) + "px";
  }

	render() {
		return (
			<div className="AccountCreateModal" ref={(e) => this.elem = e}>
				<h1>Add Account</h1>
				<p>The first step to improving your email experience.</p>

				{this.state.error != "" && <p className="AccountCreateModal-error">{this.state.error}</p>}

				{this.form.render()}
			</div>
		);
	}
}
