'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileAPI } from '@/service/request';
import type { FileItem } from '@/service/api/file';
import { DEFAULT_LIST_LIMIT, MESSAGES } from '../constants';

function joinPath(dir: string, name: string): string {
  const a = dir.trim().replace(/^\/+|\/+$/g, '');
  const b = name.trim().replace(/^\/+|\/+$/g, '');
  if (!a) return b;
  if (!b) return a;
  return `${a}/${b}`;
}

function parentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

export function useFileManagement() {
  const [path, setPath] = useState<string>('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchList = useCallback(async (nextPath: string) => {
    try {
      setLoading(true);
      const res = await FileAPI.list({
        path: nextPath,
        limit: DEFAULT_LIST_LIMIT
      });
      if (res.code === 0) {
        setPath(res.data?.path ?? nextPath);
        setItems(res.data?.items ?? []);
      } else {
        toast.error(res.message || MESSAGES.ERROR.FETCH);
      }
    } catch (error) {
      console.error('fetch files failed:', error);
      toast.error(MESSAGES.ERROR.FETCH);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchList(path);
    toast.success(MESSAGES.SUCCESS.REFRESH);
  }, [fetchList, path]);

  const openFolder = useCallback(
    async (folderPath: string) => {
      await fetchList(folderPath);
    },
    [fetchList]
  );

  const goUp = useCallback(async () => {
    await fetchList(parentPath(path));
  }, [fetchList, path]);

  const upload = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      try {
        const res = await FileAPI.upload({ files, path });
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.UPLOAD);
          await fetchList(path);
        } else {
          toast.error(res.message || MESSAGES.ERROR.UPLOAD);
        }
      } catch (error) {
        console.error('upload failed:', error);
        toast.error(MESSAGES.ERROR.UPLOAD);
      }
    },
    [fetchList, path]
  );

  const createFolder = useCallback(
    async (name: string) => {
      const folderName = name.trim();
      if (!folderName) return;

      try {
        const res = await FileAPI.createFolder(joinPath(path, folderName));
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.CREATE_FOLDER);
          await fetchList(path);
        } else {
          toast.error(res.message || MESSAGES.ERROR.CREATE_FOLDER);
        }
      } catch (error) {
        console.error('create folder failed:', error);
        toast.error(MESSAGES.ERROR.CREATE_FOLDER);
      }
    },
    [fetchList, path]
  );

  const deleteItem = useCallback(
    async (item: FileItem) => {
      try {
        const res = item.isFolder
          ? await FileAPI.deleteFolder(item.path)
          : await FileAPI.delete(item.path);

        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.DELETE);
          await fetchList(path);
        } else {
          toast.error(res.message || MESSAGES.ERROR.DELETE);
        }
      } catch (error) {
        console.error('delete failed:', error);
        toast.error(MESSAGES.ERROR.DELETE);
      }
    },
    [fetchList, path]
  );

  const download = useCallback(async (item: FileItem) => {
    try {
      const res = await FileAPI.getSignedUrl(item.path, 3600);
      if (res.code === 0 && res.data?.url) {
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(res.message || MESSAGES.ERROR.SIGNED_URL);
      }
    } catch (error) {
      console.error('signed url failed:', error);
      toast.error(MESSAGES.ERROR.SIGNED_URL);
    }
  }, []);

  const foldersFirst = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  return {
    path,
    items: foldersFirst,
    loading,
    fetchList,
    refresh,
    openFolder,
    goUp,
    upload,
    createFolder,
    deleteItem,
    download
  };
}
