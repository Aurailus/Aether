import { h, Fragment } from 'preact';

import { ID, AccountMeta } from 'common/graph/type';

import AccountSidebarItem from './AccountSidebarItem';


interface Props {
	accounts: AccountMeta[];

	active: ID;
	onClick: (id: ID) => void;
}

/**
 * Displays a list of account buttons stacked vertically,
 * indicating if they have unread messages, and the active account.
 * Shows a home account if there are two or more accounts registered.
 */

export default function AccountSidebar({ accounts, active, onClick }: Props) {
	return (
		<div class='w-18 h-full p-3 bg-gray-50 flex flex-col gap-3'>
			{accounts.length > 1 && <Fragment>
				<AccountSidebarItem
					active={active === ''}
					onClick={() => onClick('')}
					account={{
						unread: true, id: '', name: 'Home',
						image: '../../client/res/icon/home-account.svg',
						address: `${accounts.length} Account${accounts.length === 1 ? '' : 's'}`
					}}/>
				<hr class='border-b-2 rounded-full w-3/4 mx-auto'/>
			</Fragment>}

			{accounts.map(account => <AccountSidebarItem
				account={account}
				active={active === account.id}
				onClick={() => onClick(account.id)}
			/>)}
		</div>
	);
}
