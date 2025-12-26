export interface ClipboardItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  favorite?: boolean;
  isTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

