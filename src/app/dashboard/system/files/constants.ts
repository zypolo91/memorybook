export const DEFAULT_LIST_LIMIT = 200;

export const MESSAGES = {
  SUCCESS: {
    REFRESH: '已刷新',
    UPLOAD: '上传成功',
    CREATE_FOLDER: '文件夹创建成功',
    DELETE: '删除成功'
  },
  ERROR: {
    FETCH: '获取文件列表失败',
    UPLOAD: '上传失败',
    CREATE_FOLDER: '创建文件夹失败',
    DELETE: '删除失败',
    SIGNED_URL: '获取下载链接失败'
  }
} as const;
