export class ImapBox {
  name: string;
  delimiter: string;
  path: string;

  attributes: string[];

  children: ImapBox[] = [];
  parent: ImapBox | null;

  constructor(name: string, raw: RawImapBox, parent?: ImapBox) {
    this.name = name;
    this.delimiter = raw.delimiter;

    this.attributes = raw.attribs || [];

    this.parent = parent || null;
    if (this.parent) this.path = this.parent.path + this.parent.delimiter + this.name;
    else this.path = this.name;

    for (let child in raw.children) {
      this.children.push(new ImapBox(child, raw.children[child], this));
    }
  }
}

export class ImapBoxList {
  boxes: ImapBox[] = [];

  findBox(path: string): ImapBox | null {
    const recurse = (path: string, box: ImapBox): ImapBox | null => {
      if (box.name == path || box.path == path) return box;
      for (let child of box.children) {
        let e = recurse(path, child);
        if (e) return e;
      }
      return null;
    }

    for (let box of this.boxes) {
      let e = recurse(path, box);
      if (e) return e;
    }
    return null;
  }

  findBoxByAttr(attr: string): ImapBox | null {
    const recurse = (attr: string, box: ImapBox): ImapBox | null => {
      if (box.attributes.includes(attr)) return box;
      for (let child of box.children) {
        let e = recurse(attr, child);
        if (e) return e;
      }
      return null;
    }

    for (let box of this.boxes) {
      let e = recurse(attr, box);
      if (e) return e;
    }
    return null;
  }

  constructor(raws?: {[name: string]: RawImapBox} | ImapBox[]) {
    if (!raws) return;
    if (!Array.isArray(raws)) { 
      for (let box in raws) this.boxes.push(new ImapBox(box, (raws as {[name: string]: RawImapBox})[box]));
    }
    else {
      this.boxes = raws;
    }
  }
}

export interface RawImapBox {
  name: string;
  attribs: string[];
  delimiter: string;
  children: {[key: string]: RawImapBox} | null;
  parent: RawImapBox | null;
}

export interface RawImapBoxProps {
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
