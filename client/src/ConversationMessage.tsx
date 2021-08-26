import { h } from 'preact';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// import { mergeClasses } from './Util';
import { Message, Contact } from 'common/graph/type';

interface Props {
	message: Message;
	contacts: Contact[];
}

export default function ConversationMessage({ message, contacts }: Props) {
	return (
		<li class='flex gap-3 w-full last-of-type:pb-4'>
			<div class={'w-11 h-11 p-2.5 bg-gray-300/75 rounded-full flex-shrink-0 interact-none'}>
				<img class='w-6 h-6' src='../../client/res/icon/chat.svg' width={32} height={32} alt='' role='presentation'/>
			</div>
			<div class='flex flex-col pt-0.5 w-full'>
				<p class='leading-none'>
					<span class='font-medium'>{contacts.filter(contact =>
						contact.addresses.includes(message.from))[0]?.name ?? message.from}</span>
					<span class='text-sm text-gray-600 pl-1.5'>{dayjs(message.date).fromNow()}</span></p>
				<div class='text-gray-800 prose pt-1 max-w-none' dangerouslySetInnerHTML={{ __html: message.markdown }}/>
			</div>
		</li>
	);
}
