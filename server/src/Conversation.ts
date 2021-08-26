export default interface Conversation {
	title: string;
	date: Date;
	messages: Set<string>;
	participants: Set<string>;
	active: boolean;
}
