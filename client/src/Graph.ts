import { Query, Type } from 'common/graph';

// @ts-ignore
const rawQuery = window.aether.query;

export function query(query: string, data: any = {}): Promise<Partial<Type.Root>> {
	return rawQuery(query, data);
}

export const QUERY_ACCOUNTS = `{ accounts ${Query.AccountMeta} }`;
export const QUERY_ACCOUNT = `query($account: String!) { account(account: $account) ${Query.Account} }`;
export const QUERY_MESSAGES = `query($account: String!, $ids: [String!]!) {
	messages(account: $account, ids: $ids) ${Query.Message} }`;
