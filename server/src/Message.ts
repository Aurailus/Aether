export default interface Message {
	id: string;


	date: Date;
	from: string;
	to: string[];

	content: string;
}
