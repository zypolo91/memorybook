import { apiRequest, buildSearchParams, API_BASE_URL } from './base';

export interface FileItem {
  name: string;
  path: string;
  isFolder: boolean;
  size: number | null;
  mimeType: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  lastAccessedAt: string | null;
}

export class FileAPI {
  static async list(params?: {
    path?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = buildSearchParams(params || {});
    return apiRequest(`/files${searchParams ? `?${searchParams}` : ''}`);
  }

  static async createFolder(path: string) {
    return apiRequest('/files/folders', {
      method: 'POST',
      body: JSON.stringify({ path })
    });
  }

  static async deleteFolder(path: string) {
    return apiRequest('/files/folders', {
      method: 'DELETE',
      body: JSON.stringify({ path })
    });
  }

  static async delete(paths: string[] | string) {
    return apiRequest('/files', {
      method: 'DELETE',
      body: JSON.stringify({ paths: Array.isArray(paths) ? paths : [paths] })
    });
  }

  static async getSignedUrl(path: string, expiresIn?: number) {
    const searchParams = buildSearchParams({
      action: 'signedUrl',
      path,
      expiresIn
    });
    return apiRequest(`/files?${searchParams}`);
  }

  static async upload(options: {
    files: File[];
    path?: string;
    upsert?: boolean;
  }) {
    const formData = new FormData();
    if (options.path) formData.set('path', options.path);
    if (options.upsert) formData.set('upsert', '1');
    options.files.forEach((file) => formData.append('files', file));

    const res = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return res.json();
  }
}
