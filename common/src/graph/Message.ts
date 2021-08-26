import { ID, Date } from './Basic';

export interface Interface {
	id: ID;

	date: Date;
	from: string;
	to: string[];

	html: string;
	markdown: string;
}

export const Schema = `
	type Message {
		id: ID!

		date: Date!
		from: String!
		to: [String!]!

		html: String!
		markdown: String!
	}
`;

export const Query = `
	{
		id

		date
		from
		to

		markdown
	}
`;
