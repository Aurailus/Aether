import { Interface as Message } from './Message';
import { Interface as Account } from './Account';

export interface Interface {
	accounts: Omit<Account, 'messages' | 'conversations'>[];
	account: Account;
	messages: Message[];
}

export const Schema = `
	type Query {
		accounts: [Account!]!
		account(account: String!): Account
		messages(account: String!, ids: [String!]!): [Message!]!
	}
`;
