import { apiRequest } from './base';

export class UploadAPI {
  static async uploadImage(
    file: File,
    options?: { type?: string; folder?: string }
  ) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.type) {
      formData.append('type', options.type);
    }
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    const response = await fetch('/api/uploads/image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }

    return response.json();
  }
}
