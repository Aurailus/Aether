export interface SQLMessage {
	id?: number;
	box_id: number;
	conv_id: number;

	subject: string;
	
	recipients: string;
	senders: string;

	date: number;
	seqno: number;
	uid: number;
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
