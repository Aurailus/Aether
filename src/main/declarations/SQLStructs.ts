export interface SQLMessageHeader {
	box_id: number;

	subject: string;
	recipient_address: string;
	sender_address: string;

	date: number;

	seqno: number;
	uid: number;
}
