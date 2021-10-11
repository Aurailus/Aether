import { h, Fragment } from 'preact';
import { useAsyncMemo } from 'vibin-hooks';
import { useState, useLayoutEffect, useMemo } from 'preact/hooks';

import { query, QUERY_ACCOUNT, QUERY_ACCOUNTS } from './Graph';
import { ID, Contact, Conversation, AccountMeta } from 'common/graph/type';

import AccountSidebar from './AccountSidebar';
import ConversationView from './ConversationView';
import ConversationsSidebar from './ConversationsSidebar';

export default function App() {
	const [ activeAccount, setActiveAccount ] = useState<ID>('');
	const [ contacts, setContacts ] = useState<Record<ID, Contact[]>>({});
	const [ conversations, setConversations ] = useState<Record<ID, Conversation[]>>({});
	const [ activeConversation, setActiveConversation ] = useState<ID>('');

	const accounts = useAsyncMemo<AccountMeta[] | undefined>(async () => {
		let accounts = (await query(QUERY_ACCOUNTS)).accounts!;
		setActiveAccount(accounts[0]?.id ?? '');
		return accounts;
	}, []);

	const account = useMemo(() => (accounts ?? []).filter(a => a.id === activeAccount)[0],
		[ activeAccount, accounts === undefined ]);

	const conversation = useMemo(() => conversations[account?.id ?? '']?.filter(m => m.id === activeConversation)[0],
		[ activeConversation, account?.id ]);

	useLayoutEffect(() => {
		if (!account) return;
		query(QUERY_ACCOUNT, { account: account.id }).then(({ account }) => {
			if (!account) throw 'Missing account!';
			setContacts({ ...contacts, [account.id]: account.contacts });
			setConversations({ ...conversations, [account.id]: account.conversations });
			setActiveConversation(account.conversations[account.conversations.length - 1].id);
		});
	}, [ account ]);

	const handleSelectAccount = (id: ID) => {
		setActiveAccount(id);
		setActiveConversation(conversations[id] ? conversations[id][conversations[id].length - 1].id : '');
	};

	const handleSelectConversation = (id: ID) => {
		setActiveConversation(id);
	};

	return (
		<div class='flex w-screen h-screen bg-gray-200 text-gray-900'>
			<h1 class='sr-only'>Aether</h1>
			<AccountSidebar accounts={accounts ?? []} active={activeAccount} onClick={handleSelectAccount}/>
			{account && <Fragment>
				<div class='w-72 bg-gray-100 flex flex-col'>
					<div class='h-14 flex-shrink-0 border-b border-gray-50/75 shadow-sm flex items-center px-4 pl-3'>
						<img class='px-1 mr-3 interact-none' src='../../client/res/icon/email.svg' width={32} height={32}/>
						<h2 class='text-gray-900 font-medium truncate pt-0.5 pl-0.5'>{account.name}</h2>
					</div>
					<ConversationsSidebar conversations={conversations[account.id] ?? []} contacts={contacts[account.id] ?? []}
						active={activeConversation} onClick={handleSelectConversation}/>
				</div>
				<div class='flex-grow flex flex-col h-full overflow-hidden'>
					<div class='h-14 flex-shrink-0 border-b border-gray-50/50 shadow-sm flex items-center px-4'>
						<img class='px-1 mr-3 interact-none' src='../../client/res/icon/chat.svg' width={32} height={32}/>
						<h3 class='text-gray-900 font-medium truncate pt-0.5 pl-0.5'>{conversation && conversation.title}</h3>
					</div>
					{conversation && <ConversationView accountId={account.id}
						contacts={contacts[account.id]} conversation={conversation}/>}
				</div>
			</Fragment>}
			{!account && <div class='grid place-items-center w-full bg-gray-50 pr-18'>
				<div class='hue-rotate-180 brightness-50 saturate-25'>
					<img src='../../client/res/logo.svg' width={256} height={256} alt='Loading'
						class='w-[256px] h-[256px] animate-pulse grayscale sepia'/>
				</div>
			</div>}
		</div>
	);
}
