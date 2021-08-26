import { h } from 'preact';

import { ID, Conversation, Contact } from 'common/graph/type';

import ConversationSidebarItem from './ConversationsSidebarItem';

interface Props {
	contacts: Contact[];
	conversations: Conversation[];

	active: ID;
	onClick: (id: ID) => void;
}

export default function ConversationsSidebar(props: Props) {
	return (
		<ul class='flex flex-col p-1 gap-y-1 pr-0 overflow-y-scroll'>
			{props.conversations.sort((a, b) => +b.lastMessage - +a.lastMessage).map(conv =>
				<ConversationSidebarItem conversation={conv} contacts={props.contacts}
					active={props.active === conv.id} onClick={() => props.onClick(conv.id)} />)}
		</ul>
	);
}
