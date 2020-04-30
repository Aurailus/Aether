export interface SQLMessage {
	id?: number;
	
	box: number;

	subject: string;
	date: number;
	
	recipients: string;
	senders: string;

	seqno: number;
	uid: number;

	hash: string;
	reply_to?: string | null;
	chain?: number;
}

export interface SQLBox {
	id?: number;
	uidvalidity?: number;

	name: string;
	path: string;
	delimiter: string;
	attribs: string;

	parent: number;
	children: string;

	current: boolean;
}

export interface SQLChain {
	id?: number;
	
	topic: string;
	date: number;

	archived: boolean;

	participants: string;
}

export interface SQLBody {
	id?: number;
	body: string;
	lastAccessed: number;	
}

export interface SQLContact {
	id?: number;

	name: string;
	address: string;

	date: number;
}
