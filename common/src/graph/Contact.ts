export interface Interface {
	name: string;
	addresses: string[];
}

export const Schema = `
	type Contact {
		name: String!
		addresses: [String!]!
	}
`;

export const Query = `
	{
		name
		addresses
	}
`;
