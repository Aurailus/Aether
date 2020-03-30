// import * as React from 'react';
// import { ImapBox, ImapBoxes } from '../data/ImapBox';
// import { BoxItem } from './components/BoxItem';

// const inboxIcon = require('../../res/icon-mail.svg');

// interface SpecialBoxes {
//     inbox: ImapBox;
//     archived: ImapBox | null;
//     all: ImapBox | null;

//     drafts: ImapBox | null;
//     sent: ImapBox | null;

//     spam: ImapBox | null;
//     trash: ImapBox | null;

//     saved: ImapBox | null;
// }

// export class BoxStructure {
//     specialBoxes: SpecialBoxes;
//     boxes: ImapBoxes;

//     constructor(boxes: ImapBoxes) {
//       this.specialBoxes = this.identifySpecialBoxes(boxes);
//       this.boxes = boxes;
//   }

//     isSpecial(box: ImapBox) {
//       for (const boxName in this.specialBoxes) {
//       // @ts-ignore
//         const specialBox: ImapBox | null = this.specialBoxes[boxName];

//         if (specialBox !== null && specialBox === box) {
//           return true;
//       }
//     }
//       return false;
//   }

//     identifySpecialBoxes(boxes: ImapBoxes): SpecialBoxes {
//       const specialBoxes: any = {
//         inbox: null,
//         archived: null,
//         all: null,
//         drafts: null,
//         sent: null,
//         spam: null,
//         trash: null,
//         saved: null
//     };

//       const arr = this.flattenBoxes(boxes);

//       for (const box of arr) {
//         if (box.name.toLowerCase() === 'inbox') {
//           box.attribs.push('\\Inbox'); // Aether Inbox attribute.
//           specialBoxes.inbox = box;
//       }
//         if (box.attribs.includes('\\Archive')) specialBoxes.archive = box;
//         if (box.attribs.includes('\\All')) specialBoxes.all = box;
//         if (box.attribs.includes('\\Drafts')) specialBoxes.drafts = box;
//         if (box.attribs.includes('\\Sent')) specialBoxes.sent = box;
//         if (box.attribs.includes('\\Junk')) specialBoxes.spam = box;
//         if (box.attribs.includes('\\Trash')) specialBoxes.trash = box;
//         if (box.attribs.includes('\\Flagged')) specialBoxes.saved = box;
//     }

//       return specialBoxes as SpecialBoxes;
//   }

//     flattenBoxes(boxes: ImapBoxes): ImapBox[] {
//       const arr: ImapBox[] = [];
//       for (const box in boxes) {
//         this.recursivelyGetChildren(box, boxes[box], arr);
//     }
//       return arr;
//   }

//     recursivelyGetChildren(name: string, box: ImapBox, arr: ImapBox[]) {
//       arr.push(box);
//       box.name = name;
//       if (box.name.toUpperCase() === 'INBOX') box.name = 'Inbox';
//       for (const child in box.children) {
//       // box.children[child].name = child;
//         this.recursivelyGetChildren(child, box.children[child], arr);
//     }
//   }
// }
