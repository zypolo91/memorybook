export const surperAdmin = {
  name: '超级管理员',
  description: '系统超级管理员，拥有所有权限',
  isSuper: true,
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  username: process.env.ADMIN_USERNAME || 'Administrator',
  password: process.env.ADMIN_PASSWORD || 'Admin@123456'
};
