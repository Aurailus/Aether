import { h } from 'preact';

import { mergeClasses } from './Util';
import { AccountMeta } from 'common/graph/type';

interface Props {
	account: AccountMeta;
	active: boolean;
	onClick: () => void;
}

/**
 * An image button representing an account in the account sidebar.
 */

export default function AccountSidebarItem({ account, active, onClick }: Props) {
	return (
		<button key={account.id} onClick={onClick} class='w-12 h-12 group relative !outline-none'>
			<img src={account.image} alt='' role='presentation'
				style={account.unread ? {
					'-webkit-mask-image': 'url(../../client/res/mask/unread-mask.svg)', '-webkit-mask-size': '100%' } : {}}
				class={mergeClasses('interact-none transition-all ease-out bg-gray-100 group-hover:bg-gray-200',
					'group-active:duration-300 group-active:ease-bounce group-active:!rounded-[0.75rem]',
					active ? 'rounded-[0.75rem] bg-gray-200' : 'rounded-[1.5rem] group-hover:rounded-[1.10rem]')} />
			<p class='absolute interact-none px-2.5 py-2 left-full rounded shadow-md -top-0.5 bg-black
				text-left whitespace-nowrap transition-all duration-75 transform translate-x-3 scale-90 opacity-0
				group-hover:scale-100 group-hover:opacity-100 group-hover:translate-x-5'>
				<span class='block font-medium leading-none text-gray-800 mb-1'>{account.name}</span>
				<span class='block text-sm leading-none text-gray-700'>{account.address}</span>
				<div class='absolute w-0 h-0 border-8 border-black border-t-transparent
					border-r-transparent top-4 -left-px transform rotate-45'/>
			</p>
			{account.unread && <div class='absolute w-3 h-3 left-8 bottom-8 m-0.5 rounded-full bg-blue-300'>
				<div class='w-3 h-3 rounded-full bg-blue-300 animate-ping'/>
			</div>}
		</button>
	);
}
