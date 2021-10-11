import { ObjectID } from 'mongodb';
import { prop, index, Ref, getModelForClass, modelOptions } from '@typegoose/typegoose';

export type Create<T> = Omit<T, 'id' | '_id'>;

export enum MailboxType {
	Box = 'NORMAL_BOX',
	Archives = 'ARCHIVES',
	All = '\\All',
	Drafts = '\\Drafts',
	Starred = '\\Flagged',
	Important = '\\Important',
	Inbox = '\\Inbox',
	Spam = '\\Junk',
	Sent = '\\Sent',
	Trash = '\\Trash'
};

@modelOptions({ schemaOptions: { versionKey: false }})
@index({ address: 1 })
export class Account {
	id!: string;
	_id!: ObjectID;

	@prop({ required: true })
	name!: string;

	@prop()
	image?: string;

	@prop({ required: true })
	address!: string;

	@prop({ required: true })
	password!: string;

	@prop({ required: true })
	host!: string;

	@prop({ required: true })
	port!: number;

	@prop({ default: true })
	tls!: boolean;
};

export const AccountModel = getModelForClass(Account);

@modelOptions({ schemaOptions: { versionKey: false }})
@index({ account: 1, path: 1 })
export class Mailbox {
	id!: string;
	_id!: ObjectID;

	@prop({ required: true, ref: Account })
	account!: Ref<Account>;

	@prop({ required: true })
	name!: string;

	@prop({ required: true })
	path!: string;

	@prop({ required: true })
	delimiter!: string;

	@prop({ required: true })
	type!: MailboxType;

	@prop({ required: true, type: [String] })
	private _treeTypes!: MailboxType[];

	get treeTypes(): Set<MailboxType> { return new Set(this._treeTypes); }
	set treeTypes(treeTypes: Set<MailboxType>) { this._treeTypes = [ ...treeTypes ]; }

	@prop({ ref: Mailbox })
	parent?: Ref<Mailbox>;

	@prop({ required: true })
	uidValidity!: number;

	@prop({ required: true })
	uidNext!: number;
};

export const MailboxModel = getModelForClass(Mailbox);

@modelOptions({ schemaOptions: { versionKey: false }})
export class Contact {
	id!: string;
	_id!: ObjectID;

	@prop({ default: false })
	userCreated?: boolean;

	@prop({ required: true })
	name!: string;

	@prop({ default: [], type: [String]})
	addresses?: string[];
};

export const ContactModel = getModelForClass(Contact);

@modelOptions({ schemaOptions: { versionKey: false }})
@index({ account: 1, messageId: 1 })
@index({ account: 1, box: 1, uid: 1 })
export class Message {
	id!: string;
	_id!: ObjectID;

	@prop({ required: true, ref: Account })
	account!: Ref<Account>;

	@prop({ required: true, ref: Mailbox })
	box!: Ref<Mailbox>;

	@prop({ required: true })
	uid!: number;

	@prop({ required: true })
	messageId!: string;

	@prop({ required: true })
	subject!: string;

	@prop({ required: true })
	date!: Date;

	// @prop({ required: true, ref: Contact })
	// from!: Ref<Contact>;

	// @prop({ required: true, ref: Contact })
	// to!: Ref<Contact>[];
};

export const MessageModel = getModelForClass(Message);
