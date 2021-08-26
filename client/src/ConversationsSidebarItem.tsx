import { h } from 'preact';

import { mergeClasses } from './Util';
import { Contact, Conversation } from 'common/graph/type';

interface Props {
	contacts: Contact[];
	conversation: Conversation;

	active: boolean;
	onClick: () => void;
}

export default function ConversationItem({ conversation: conv, contacts, active, onClick }: Props) {
	return (
		<li key={conv.id}>
			<button onClick={onClick}
				class={mergeClasses(
					'w-full flex items-center gap-2.5 text-left px-1.5 py-1.5 rounded focus:outline-none',
					active ? 'bg-gray-300/50' : 'hover:bg-gray-200')}>
				<div class={mergeClasses(
					'w-9 h-9 p-2 bg-gray-300/75 rounded-full flex-shrink-0 interact-none',
					active && 'bg-gray-300')}>
					<img class='w-5 h-5' src='../../client/res/icon/chat.svg' width={32} height={32} alt='' role='presentation'/>
				</div>
				<div class='overflow-hidden flex flex-col justify-center'>
					<p class={mergeClasses('text-sm font-medium truncate', active ? 'text-gray-900' : 'text-gray-600')}>
						{conv.title}</p>
					<p class={mergeClasses('text-xs font-medium truncate', active ? 'text-gray-800' : 'text-gray-400')}>
						{conv.participants.map(address => contacts.filter(contact =>
							contact.addresses.includes(address))[0]?.name ?? address).join(', ')}</p>
				</div>
			</button>
		</li>
	);
}
