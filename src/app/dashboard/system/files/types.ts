import type { FileItem } from '@/service/api/file';

export type FileEntry = FileItem;

export interface FileListResult {
  path: string;
  items: FileEntry[];
}

export interface FileDialogState {
  uploadOpen: boolean;
  newFolderOpen: boolean;
}
