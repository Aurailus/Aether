export interface SQLMessage {
	id?: number;
	box_id: number;
	conv_id: number;

	subject: string;
	date: number;
	
	recipients: string;
	senders: string;

	seqno: number;
	uid: number;

	hash: string;
	reply_to?: string | null;
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
