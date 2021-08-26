import { buildSchema } from 'graphql';

import { Type, SCHEMA } from 'common/graph';

import Message from './Message';
import Account from './Account';
import Conversation from './Conversation';

export interface Context {
	accounts: Record<Type.ID, Account>;
}

export const Schema = buildSchema(SCHEMA);

function messageResolver(message: Message) {
	return {
		id: message.id,
		date: message.date,
		from: message.from,
		to: message.to,

		html: () => message.content,
		markdown: () => message.content
	};
}

function conversationResolver(conversation: Conversation, id: string) {
	return {
		id: id,
		unread: false,
		title: conversation.title,
		lastMessage: conversation.date,
		messages: conversation.messages,
		participants: conversation.participants
	};
}

function accountResolver(account: Account, id: string) {
	return {
		id: id,
		name: account.getName(),
		image: account.getImage(),
		address: account.getAddress(),
		unread: account.hasUnreads(),

		messages: [],
		contacts: () => account.getContacts(),
		conversations: () => {
			const conversations = account.getConversations();
			for (let key in conversations) if (!conversations[key].active) delete conversations[key];
			return Object.keys(conversations).map(id => conversationResolver(conversations[id as any], id));
		}
	};
}

export const Resolver = {
	accounts: (_: any, ctx: Context) => Object.keys(ctx.accounts).map(id => accountResolver(ctx.accounts[id], id)),
	account: ({ account: id }: { account: string }, ctx: Context) => accountResolver(ctx.accounts[id], id),
	messages: async ({ account, ids }: { account: string; ids: string[] }, ctx: Context) =>
		(await ctx.accounts[account].getMessages(ids)).map(msg => messageResolver(msg))
};
