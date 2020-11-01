import * as React from 'react';

import "./AccountCreateModal.scss";

import { FormManager } from "../../FormManager"
import { LoadingSpinner } from "../LoadingSpinner"

import { SerializedAccount } from "../../../data/SerializedAccount"
import { ImapBoxList } from '../../../main/declarations/ImapBox'

const { ipcRenderer } = require('electron');

interface Props {
	submit: (fields: AccountCreateModalFields) => void;
	cancel: () => void;
}

interface State {
	error: string;
}

export interface AccountCreateModalFields {
	name: string;
	email: string;
	password: string;

	imap_user: string;
	imap_host: string;
	imap_port: string;

	smtp_user: string;
	smtp_host: string;
	smtp_port: string;

	box_inbox: string;
	box_sent: string;
	box_spam: string;
	box_trash: string;
	box_archive: string;
}

export class AccountCreateModal extends React.Component<Props, State> {
	elem: HTMLElement | null = null;
	form: FormManager;

	constructor(props: any) {
		super(props);

		this.state = { error: "" }

		this.handleTestResult = this.handleTestResult.bind(this);

		this.form = new FormManager({
			update: () => this.forceUpdate(),
			submit: this.props.submit,
			cancel: this.props.cancel
		}, [{
			fields: [
				{name: "name", label: "Name", props: {maxLength: 64}, validate: "NotEmpty"},
				{name: "email", label: "Email", props: {maxLength: 128}, validate: "Email"},
				{name: "password", type: "password", label: "Password", validate: "NotEmpty"},
			],
			nav: {
				next: "Next",
				previous: "Cancel",
				onNext: (form: FormManager) => {
					if (form.fields.imap_user == "") form.fields.imap_user = form.fields.email;
					if (form.fields.smtp_user == "") form.fields.smtp_user = form.fields.email;
				}
			}
		}, {
			fields: [
				{name: "imap_user", label: "IMAP User", validate: "NotEmpty"},
				{name: "imap_host", label: "IMAP Host", display: "inl-70 pad", validate: "URL"},
				{name: "imap_port", label: "IMAP Port", display: "inl-30", props: {maxLength: 5}, default: "993", validate: "Number"},

				{type: "HR"},
				
				{name: "smtp_user", label: "SMTP User", validate: "NotEmpty"},
				{name: "smtp_host", label: "SMTP Host", display: "inl-70 pad", validate: "URL"},
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
				{name: "box_inbox", label: "Inbox", type: "boxlist", display: "inl-50 pad", default: "INBOX"},
				{name: "box_sent", label: "Sent", type: "boxlist", display: "inl-50", default: "\\Sent"},
				{name: "box_spam", label: "Spam", type: "boxlist", display: "inl-50 pad", default: "\\Junk"},
				{name: "box_trash", label: "Trash", type: "boxlist", display: "inl-50", default: "\\Trash"},
				{type: "DESC", head: "Archive Root", text: "Please select a box to be the root of your Archives." + 
					"Tagged conversations will be stored as children of this box. Do not select a box that will automatically clear its contents!"},
				{name: "box_archive", type: "boxlist", default: "Archive"}
			],
			nav: {
				previous: "Back",
				next: "Done",
				onPrevious: (form) => {
		  		for (let field of this.form.pages[3].fields!) {
		  			if (field.type == "boxlist") {
		  				field.boxList = new ImapBoxList();
		  				this.form.fields[field.name!] = "";
		  			}
		  		}

					form.formBack(null, false)
				}
			}
		}])
	}

	componentDidUpdate() { 
		setTimeout(() => this.updateHeight(), 0); 
	}

  componentDidMount() { 
  	setTimeout(() => this.updateHeight(), 0);
  	ipcRenderer.on('test-result', this.handleTestResult);
  }

  componentWillUnmount() {
  	ipcRenderer.off('test-result', this.handleTestResult);
  }

  private handleTestResult(_: any, success: boolean, v: string | ImapBoxList) {
  	if (!success) {
  		this.setState({error: v as string});
  		this.form.formBack();
  		return;
  	}
  	else {
  		this.form.formForward();
  		for (let field of this.form.pages[3].fields!)
  			if (field.type == "boxlist") field.boxList = new ImapBoxList((v as ImapBoxList).boxes);
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
				<h1>{this.form.page < 3 ? "Add Account" : "Configuration"}</h1>
				<p>{this.form.page < 3 ? "The first step to improving your email experience." : "Please ensure the following options are correct:"}</p>

				{this.state.error != "" && <p className="AccountCreateModal-error">{this.state.error}</p>}

				{this.form.render()}
			</div>
		);
	}
}
