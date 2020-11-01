import * as React from 'react';

import "./FormManager.scss";

import { FormInput } from './components/FormInput'
import { FormBoxList } from './components/FormBoxList'
import { ImapBoxList } from '../main/declarations/ImapBox'

const nextButton = require('../../res/ico/icon-next.svg');

const regex_notEmpty = /.+/g;
const regex_URL = /.+\..+/g; 
const regex_email = /.+@.+\..+/g;
const regex_number = /^\d+$/g;

interface Opts {
	start?: number;
	update: () => void,
	submit: (fields: any) => void;
	cancel: () => void;
}

interface Page {
	fields?: Elem[],
	raw?: JSX.Element,
	nav: {
		next?: string | boolean;
		previous?: string | boolean;

		onNext?: (form: FormManager) => void;
		onPrevious?: (form: FormManager) => void;
	}
}

interface Elem {
	name?: string;
	type?: string;

	label?: string;
	display?: string;

	props?: { maxLength?: number; }
	default?: string;
	validate?: string | RegExp;
	
	head?: string; // For desc
	text?: string; // For paragraphs & desc
	boxList?: ImapBoxList; // For boxLists
}

export class FormManager {
	opts: Opts;
	pages: Page[];
	fields: any = {};
	regexes: any = {};

	page: number = 0;
	canProgress: boolean = false;

	constructor(opts: Opts, pages: Page[]) {
		this.opts = opts;
		this.pages = pages;

		this.page = opts.start || 0;

		for (let page of this.pages) {
			if (!page.fields) continue;
			for (let field of page.fields) {
				if (!field.name) continue;
				this.fields[field.name] = field.default || "";

				if (typeof field.validate == "string") {
					if (field.validate == "URL") field.validate = regex_URL;
					else if (field.validate == "NotEmpty") field.validate = regex_notEmpty;
					else if (field.validate == "Email") field.validate = regex_email;
					else if (field.validate == "Number") field.validate = regex_number;
				}

				if (field.validate) this.regexes[field.name] = field.validate;
			}
		}

		this.validate();

		this.handleChange = this.handleChange.bind(this);
		this.formForward = this.formForward.bind(this);
		this.formBack = this.formBack.bind(this);
	}

	formForward(ev?: any, triggerCallbacks?: boolean) {
		if (triggerCallbacks === undefined || triggerCallbacks)
			if (this.pages[this.page].nav.onNext) this.pages[this.page].nav.onNext!(this);
		
		if (this.page == this.pages.length - 1) {
			this.opts.submit(Object.assign({}, this.fields));
			if (ev) ev.preventDefault();
			return false;
		}

		this.page += 1;
		this.validate();

		this.opts.update();
		if (ev) ev.preventDefault();
		return false;
	}

	formBack(ev?: any, triggerCallbacks?: boolean) {
		if (triggerCallbacks === undefined || triggerCallbacks)
			if (this.pages[this.page].nav.onPrevious) this.pages[this.page].nav.onPrevious!(this);
		
		if (this.page == 0) {
			this.opts.cancel();
			if (ev) ev.preventDefault();
			return false;
		}

		this.page -= 1;
		this.validate();

		this.opts.update();
		if (ev) ev.preventDefault();
		return false;
	}

	private handleChange(name: string, ev: any|string): void {
		if (typeof ev == "string") this.fields[name] = ev;
		else this.fields[name] = ev.target.value;

		this.validate();
		this.opts.update();
	}

	private validate() {
		let valid = true;
		for (let elem of this.pages[this.page].fields || []) {
			const fieldName = elem.name || "";
			const type = elem.type;

			if (type == "boxlist") {
				if (this.fields[fieldName] == "") valid = false;
				continue;
			}

			const regex = this.regexes[fieldName];
			if (!regex) continue;

			const field = this.fields[fieldName];
			if (!(field.match(regex))) {
				valid = false;
				break;
			}
		}

		this.canProgress = valid;
	}

	render() {
		const page = this.pages[this.page];
		let keyID = 0;
		return (
			<form className="FormManager-Form" onSubmit={this.formForward} key={"page_" + page}>
				{page.raw}

				{page.fields && page.fields.map((fields: Elem, i: number) => {

					if (fields.type && fields.type.toLowerCase() == "p") {
						return <p className="FormManager-Para" key={keyID++}>{fields.text || "<Empty Paragraph>"}</p> 
					}
					else if (fields.type && fields.type.toLowerCase() == "desc") {
						return <div key={keyID++}>
							<h2 className="FormManager-DescHead">{fields.head}</h2>
							<p  className="FormManager-DescBody">{fields.text}</p>
						</div>
					}
					else if (fields.type && fields.type.toLowerCase() == "hr") {
						return <hr key={keyID++}/>
					}

					let props = Object.assign({}, fields.props || {}) as any;
					if (i == 0) props.autoFocus = true;

					if (fields.type && fields.type.toLowerCase() == "boxlist") {
						return <FormBoxList
							key={fields.name}
							label={fields.label || ""}
							name={fields.name || "UNNAMED"}

							fields={this.fields}
							callback={this.handleChange}
							default={fields.default}

							classes={fields.display}
							boxList={fields.boxList || new ImapBoxList({})}
						/>
					}
					
					return <FormInput
						key={fields.name}
						type={fields.type || "text"}
						label={fields.label || ""}
						name={fields.name || "UNNAMED"}

						fields={this.fields}
						callback={this.handleChange}

						validate={fields.validate as RegExp}

						props={props} 
						classes={fields.display}
					/>
				})}

				<div className="FormManager-FormNavWrap">
					{page.nav.next && 
						<button className="FormManager-FormNavButton next" onClick={this.formForward} disabled={!this.canProgress}>
							{typeof page.nav.next == "string" ? page.nav.next : "Next"}
							<img src={nextButton} />
						</button>
					}
					
					{page.nav.previous && 
						<button className="FormManager-FormNavButton previous" onClick={this.formBack}>{typeof page.nav.previous == "string" ? page.nav.previous : "Previous"}</button>
					}
				</div>
			</form>
		)
	}
}
