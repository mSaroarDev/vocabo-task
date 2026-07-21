export interface IStickyNoteGroup {
  _id: string;
  user: string;
  name: string;
  order: number;
}

export interface IStickyNote {
  _id: string;
  user: string;
  groupId: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  order: number;
  nanoid?: string;
}
