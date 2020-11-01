import { RawImapBox } from './ImapBox';
import { SerializedAccount } from '../../data/SerializedAccount';

export declare class RawImap {
	constructor(acct: SerializedAccount);

	once(evt: string, cb: any): null;
	on(evt: string, cb: any): null;

	connect(): null;
	destroy(): null;
	end(): null;
	
	getBoxes(cb: (err: string, boxes: { [key: string]: RawImapBox }) => void): void;
	openBox(box: string, readOnly: boolean, cb: (err: string, box: any) => void): void;
	
	fetch(messages: number | string | number[], opts: any): any;
	search(flags: string[], cb: (err: string, res: any) => void): void;

	seq: {
		fetch(messages: number | string | number[], opts: any): any;
		search(flags: string[], cb: (err: string, res: any) => void): void;
	}
}
