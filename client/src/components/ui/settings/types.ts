export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Team {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface NavGroupItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavGroupItem[];
}
