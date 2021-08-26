import { ID } from './Basic';

export interface Interface {
	id: ID;
	unread: boolean;

	title: string;
	lastMessage: Date;
	messages: string[];
	participants: string[];
}

export const Schema = `
	type Conversation {
		id: ID!
		unread: Boolean!

		title: String!
		lastMessage: Date!
		messages: [String!]!
		participants: [String!]!
	}
`;

export const Query = `
	{
		id
		unread

		title
		lastMessage
		messages
		participants
	}
`;
