export interface SQLMessage {
	id?: number;

	subject: string;
	
	recipients: string;
	senders: string;

	date: number;
	seqno: number;
	
	uid: number;
	box_id: number;
	conv_id: number;
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
}

export interface SQLConversation {
	id?: number;
	
	topic: string;
	date: number;

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
