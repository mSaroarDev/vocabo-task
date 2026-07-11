export interface IChecklistItem {
  itemId: string;
  title: string;
  checked: boolean;
  order: number;
}

export interface IChecklist {
  _id: string;
  user: string;
  title: string;
  order: number;
  items: IChecklistItem[];
}
