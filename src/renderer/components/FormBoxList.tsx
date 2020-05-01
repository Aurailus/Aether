import * as React from 'react';

import { ImapBox } from "../../main/declarations/ImapBox"

import './FormBoxList.scss';

const icons: {[key: string]: any} = {
	generic: 	 require('../../../res/ico/icon-folder.svg'),
	inbox:  	 require('../../../res/ico/icon-inbox.svg'),
	archive: 	 require('../../../res/ico/icon-archive.svg'),
	sent:      require('../../../res/ico/icon-group.svg'),
	important: require('../../../res/ico/icon-important.svg'),
	trash: 		 require('../../../res/ico/icon-trash.svg'),
	drafts: 	 require('../../../res/ico/icon-drafts.svg'),
	spam: 		 require('../../../res/ico/icon-spam.svg')
}

interface Props {
	classes?: string;
	label: string;
	name: string;
	fields: any;
	callback: (name: string, e: any) => void,
	boxes: {[key: string]: ImapBox};
}

interface State {
	modalStyles: any;
	query: string;
}

export class FormBoxList extends React.Component<Props, State> {
	root: HTMLElement | null = null;

	constructor(props: Props) {
		super(props);
		this.state = { modalStyles: null, query: "" };

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
			let opts = this.root.querySelectorAll('.FormBoxList-BoxItem');
			let ind = -1;

			for (let i = 0; i < opts.length; i++) if (opts[i] == current) ind = i;

			if (ev.which == 38 && ind != -1) ind -= 1;
			if (ev.which == 40) ind += 1;
			ind = ((ind % opts.length) + opts.length) % opts.length;

			(opts[ind] as HTMLElement).focus();

			ev.preventDefault();
			return false;	
		}
		else {
			if (document.activeElement != this.root.querySelector('.FormBoxList-Search')) {
				(document.querySelector('.FormBoxList-Search') as HTMLElement).focus();
			}
			else {
				if (ev.key == "Enter") {
					// Search (Enter) in the box.
					console.log("SEARCH enter");
					ev.preventDefault();
				}
				return false;
			}
			return true;
		}
	}

	boxClickCallback(ev: any) {
		console.log('box clickeddd');

		ev.preventDefault();
		return false;
	}

	componentDidMount() {
		if (this.root != null) {
			let styles = { left: this.root.getBoundingClientRect().left + "px", width: this.root.clientWidth + "px", top: this.root.getBoundingClientRect().top + "px" };
			this.setState({modalStyles: styles})
		}
	}

	renderBox(name: string, box: ImapBox): JSX.Element[] {
		let icon = "generic";

    if (name.toLowerCase() === 'inbox') icon = "generic";
    else if (box.attribs.includes('\\Archive')) icon = "archive";
    else if (box.attribs.includes('\\All'))     icon = "archive";
    else if (box.attribs.includes('\\Drafts'))  icon = "drafts";
    else if (box.attribs.includes('\\Sent'))    icon = "sent";
    else if (box.attribs.includes('\\Junk'))    icon = "spam";
    else if (box.attribs.includes('\\Trash'))   icon = "trash";
    else if (box.attribs.includes('\\Flagged')) icon = "important";

    let ret: JSX.Element[] = [];

    if (this.state.query == "" || name.toLowerCase().includes(this.state.query.toLowerCase())) {
	    ret.push(
	    	<button 
	    		key={name} 
	    		tabIndex={-1}
	    		className="FormBoxList-BoxItem small" 
	    		
					onKeyDown={this.keydownCallback}
					onClick={this.boxClickCallback}
    		>
					<img className="FormBoxList-BoxItemIcon" src={icons[icon]} />
					<span>{name}</span>
				</button>
			);
	  }

		if (Object.keys(box.children || {}).length > 0) {	
			if (this.state.query == "") {
				ret.push(
					<div className="FormBoxList-BoxChildren" key={name + "__children"}>
						{Object.keys(box.children!).map((name) => this.renderBox(name, box.children![name]))}
					</div>
				);
			}
			else {
				for (let name in box.children) {
					ret.push(...this.renderBox(name, box.children![name]));
				}
			}
		}

		return ret;
	}

	render() {
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
					/>
					{/*{Object.keys(this.props.boxes).length == 0 &&
						<div className="FormBoxList-BoxItem" key="current">
							<span style={{opacity: 0.5}}>&lt;No Boxes&gt;</span>
						</div>
					}*/}

					<div className="FormBoxList-Dropdown">
						{Object.keys(this.props.boxes).map((name) => this.renderBox(name, this.props.boxes[name]))}
					</div>
				</div>
			</div>
		);
	}
}
