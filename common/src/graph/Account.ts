import { Interface as Contact, Query as ContactQuery } from './Contact';
import { Interface as Conversation, Query as ConversationQuery } from './Conversation';

import { ID } from './Basic';

export interface MetaInterface {
	id: ID;
	name: string;
	image?: string;
	address: string;
	unread: boolean;
}

export interface Interface extends MetaInterface {
	messages: string[];
	contacts: Contact[];
	conversations: Conversation[];
}

export const Schema = `
	type Account {
		id: ID!
		name: String!
		image: String
		address: String!
		unread: Boolean!

		messages: [String!]!
		contacts: [Contact!]!
		conversations: [Conversation!]!
	}
`;

export const Query = `
	{
		id
		name
		image
		address
		unread
		
		messages
		contacts ${ContactQuery}
		conversations ${ConversationQuery}
	}
`;

export const MetaQuery = `
	{
		id
		name
		image
		address
		unread
	}
`;
