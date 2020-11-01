import * as React from 'react';

import { ImapBoxList, ImapBox } from "../../main/declarations/ImapBox"

import './FormBoxList.scss';

const icons: {[key: string]: any} = {
	none: 	   require('../../../res/ico/icon-select.svg'),
	generic: 	 require('../../../res/ico/icon-folder.svg'),
	inbox:  	 require('../../../res/ico/icon-inbox.svg'),
	archive: 	 require('../../../res/ico/icon-archive.svg'),
	sent:      require('../../../res/ico/icon-sent.svg'),
	important: require('../../../res/ico/icon-important.svg'),
	trash: 		 require('../../../res/ico/icon-delete.svg'),
	drafts: 	 require('../../../res/ico/icon-drafts.svg'),
	spam: 		 require('../../../res/ico/icon-spam.svg')
}

interface Props {
	classes?: string;
	label: string;
	name: string;

	fields: any;
	callback: (name: string, e: any) => void,
	
	default?: string;
	boxList: ImapBoxList;
}

interface State {
	modalStyles: any;
	query: string;
	oldBoxList: ImapBoxList
}

export class FormBoxList extends React.Component<Props, State> {
	root: HTMLElement | null = null;

	constructor(props: Props) {
		super(props);
		this.state = { modalStyles: null, query: "", oldBoxList: props.boxList };

		this.blurCallback = this.blurCallback.bind(this);
		this.changeCallback = this.changeCallback.bind(this);
		this.keydownCallback = this.keydownCallback.bind(this);
		this.boxClickCallback = this.boxClickCallback.bind(this);
	}

	changeCallback(ev: any) {
		this.setState({ query: ev.target.value });
	}

	keydownCallback(ev: any) {
		if (this.root == null) return true;
		if (ev.key == "ArrowUp" || ev.key == "ArrowDown") {
			// Select elements from the search results or box structure
			let current = document.activeElement!;
			let opts = this.root.querySelectorAll('.FormBoxList-Dropdown .FormBoxList-BoxItem');
			let ind = -1;

			for (let i = 0; i < opts.length; i++) if (opts[i] == current) ind = i;

			if (ev.key == "ArrowUp" && ind != -1) ind -= 1;
			if (ev.key == "ArrowDown") ind += 1;
			ind = ((ind % opts.length) + opts.length) % opts.length;

			(opts[ind] as HTMLElement).focus();

			ev.preventDefault();
			return false;	
		}
		else {
			if (document.activeElement != this.root.querySelector('.FormBoxList-Search')) {
				// (document.querySelector('.FormBoxList-Search') as HTMLElement).focus();
			}
			else {
				if (ev.key == "Enter") {
					// Search (Enter) in the box.
					let first = this.root.querySelector('.FormBoxList-Dropdown .FormBoxList-BoxItem');
					if (first) (first as HTMLElement).click();
					ev.preventDefault();
				}
				return false;
			}
			return true;
		}
	}

	blurCallback() {
		setTimeout(() => {
			if (!this.root!.contains(document.activeElement)) this.setState({ query: "" });
		}, 100)
	}

	boxClickCallback(box: ImapBox, ev: any) {
		this.props.callback(this.props.name, box.path);

		(document.activeElement! as HTMLElement).blur();
		ev.preventDefault();
		return false;
	}

	componentDidMount() {
		if (this.root != null) {
			let styles = { left: this.root.getBoundingClientRect().left + "px", width: this.root.clientWidth + "px", top: this.root.getBoundingClientRect().top + "px" };
			this.setState({modalStyles: styles})
		}
	}

	findDefault() {
		if (!this.props.default) return;

		let state = { oldBoxList: this.props.boxList } as State;
		this.setState(state);

		let found = null;
		if (this.props.default.substr(0, 1) == "\\") {
			found = this.props.boxList.findBoxByAttr(this.props.default);
		}
		else {
			found = this.props.boxList.findBox(this.props.default);
		}
		if (found != null) this.props.callback(this.props.name, found.path);
	}

	renderBox(box: ImapBox, children?: boolean, classes?: string): JSX.Element[] {
		let icon = "generic";

    if      (box.name.toLowerCase() === 'inbox')   icon = "inbox";
    else if (box.attributes.includes('\\Archive')) icon = "archive";
    else if (box.attributes.includes('\\All'))     icon = "archive";
    else if (box.attributes.includes('\\Drafts'))  icon = "drafts";
    else if (box.attributes.includes('\\Sent'))    icon = "sent";
    else if (box.attributes.includes('\\Junk'))    icon = "spam";
    else if (box.attributes.includes('\\Trash'))   icon = "trash";
    else if (box.attributes.includes('\\Flagged')) icon = "important";

    let ret: JSX.Element[] = [];

    if (this.state.query == "" || box.name.toLowerCase().includes(this.state.query.toLowerCase())) {
	    ret.push(
	    	<button 
	    		key={box.name} 
	    		tabIndex={-1}
	    		className={"FormBoxList-BoxItem " + (classes ? classes : "small")}	
	    		
					onKeyDown={this.keydownCallback}
					onClick={(ev) => this.boxClickCallback(box, ev)}
					onBlur={this.blurCallback}
    		>
					<img className="FormBoxList-BoxItemIcon" src={icons[icon]} />
					<span>{box.name.toLowerCase() == "inbox" ? "Inbox" : box.name}</span>
				</button>
			);
	  }

		if ((children === undefined || children) && Object.keys(box.children || {}).length > 0) {	
			if (this.state.query == "") {
				ret.push(
					<div className="FormBoxList-BoxChildren" key={box.name + "__children"}>
						{box.children.map((child) => this.renderBox(child))}
					</div>
				);
			}
			else {
				for (let child of box.children) {
					ret.push(...this.renderBox(child));
				}
			}
		}

		return ret;
	}

	render() {
		if (this.state.oldBoxList != this.props.boxList) setTimeout(() => this.findDefault(), 0);
		let selBox = this.props.boxList.findBox(this.props.fields[this.props.name]);

		return (
			<div className={
				"FormBoxList " + 
				(this.props.fields[this.props.name] == "" ? "empty " : "notEmpty ") + (this.props.classes || "")}>

				<label className="FormBoxList-Label">{this.props.label}</label>
				<div className="FormBoxList-Root" ref={(i) => this.root = i}>
					<input className="FormBoxList-Search"
						value={this.state.query}
						onKeyDown={this.keydownCallback}
						onChange={this.changeCallback}
						onBlur={this.blurCallback}
					/>
					{selBox ? this.renderBox(selBox, false, "selected") :
						<div className="FormBoxList-BoxItem selected" key="selectedBox">
							<img style={{opacity: "0.3"}} className="FormBoxList-BoxItemIcon" src={icons["none"]} />
							<span style={{opacity: "0.5"}}>Select a box</span>
						</div>
					}

					<div className="FormBoxList-Dropdown">
						{this.props.boxList.boxes.map((box) => this.renderBox(box))}
					</div>
				</div>
			</div>
		);
	}
}
