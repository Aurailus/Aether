import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useAsyncMemo } from 'vibin-hooks';

import { query, QUERY_MESSAGES } from './Graph';
import { Message, Contact, Conversation } from 'common/graph/type';

import ConversationMessage from './ConversationMessage';
import { mergeClasses } from './Util';

interface Props {
	accountId: string;
	contacts: Contact[];
	conversation: Conversation;
}

export default function ConversationView({ accountId, conversation, contacts }: Props) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [ bottom, setBottom ] = useState<boolean>(false);

	useEffect(() => {
		let elem = scrollRef.current!;
		let scrolled = true;
		const callback = () => scrolled = true;
		elem.addEventListener('scroll', callback);
		window.addEventListener('resize', callback);

		const test = () => {
			if (!scrolled) return;
			setBottom(elem.scrollHeight <= elem.offsetHeight ||
				elem.scrollTop + elem.offsetHeight >= elem.scrollHeight);
			scrolled = false;
		};

		test();
		let interval = window.setInterval(test, 100);

		return () => {
			elem.removeEventListener('scroll', callback);
			window.removeEventListener('resize', callback);
			window.clearInterval(interval);
		};
	}, []);

	const messages = useAsyncMemo<Message[]>(async () => {
		let res = (await query(QUERY_MESSAGES, { account: accountId, ids: conversation.messages })).messages!;
		window.requestAnimationFrame(() => scrollRef.current!.scrollTo({ top: scrollRef.current!.scrollHeight }));
		return res;
	}, [ conversation.lastMessage, accountId ]);

	return (
		<div class='flex flex-col overflow-hidden h-full scrollbar-200'>
			<div class='flex-grow overflow-auto' ref={scrollRef}>
				<ol class='flex flex-col justify-end gap-6 flex-grow p-3 min-h-full'>
					{(messages ?? []).map(message => <ConversationMessage contacts={contacts} message={message}/>)}
				</ol>
			</div>
			<div
				style={!bottom ? { boxShadow: '0 0 16px 0 rgba(0, 0, 0, 0.15), 0 0 4px 0 rgba(0, 0, 0, 0.2)'} : {}}
				class={mergeClasses('relative p-2.5 flex flex-shrink-0 gap-2 z-10 transition-all border-t',
					!bottom && ' border-gray-100')}>
				<div class='w-10 h-10 bg-gray-100 rounded-full'/>
				<div class='w-10 h-10 bg-gray-100 rounded-full'/>
				<div class='flex-grow h-10 bg-gray-100 rounded-full flex items-center pl-4'>
					<p class='text-gray-500'>Send a message...</p>
				</div>
				<div class='w-10 h-10 bg-gray-100 rounded-full'/>
			</div>
		</div>
	);
}
