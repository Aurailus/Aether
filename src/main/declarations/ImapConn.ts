import { ImapBox } from './ImapBox';
import { SerializedAccount } from '../../data/SerializedAccount';

export declare class ImapConn {
	constructor(acct: SerializedAccount);

	once(evt: any, fcn: any): any;
	connect(): null;
	getBoxes(cb: (err: string, boxes: { [key: string]: ImapBox }) => void): void;
	openBox(box: string, readOnly: boolean, cb: (err: string, box: any) => void): void;
	fetch(messages: number | string | number[], opts: any): any;
	search(flags: string[], cb: (err: string, res: any) => void): void;

	seq: {
		fetch(messages: number | string | number[], opts: any): any;
		search(flags: string[], cb: (err: string, res: any) => void): void;
	}
}
