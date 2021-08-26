import { Schema as Basic } from './Basic';
import { Schema as Account } from './Account';
import { Schema as Contact } from './Contact';
import { Schema as Message } from './Message';
import { Schema as Conversation } from './Conversation';
import { Schema as Root } from './Root';

export const SCHEMA = [ Basic, Contact, Message, Conversation, Account, Root ].join('\n');
