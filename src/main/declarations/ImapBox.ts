export interface ImapBox {
  name: string;
  attribs: string[];
  delimiter: string;
  children: {[key: string]: ImapBox} | null;
  parent: ImapBox | null;
}

export interface ImapBoxProps {
  name: string;
  readonly: boolean;

  flags: string[];
  permFlags: string[];
  keywords: [];
  newKeywords: boolean;

  uidvalidity: number;
  uidnext: number;
  persistentUIDs: boolean;

  messages: { total: number, new: number }
  highestmodseq: string;
  nomodseq: boolean;
}
