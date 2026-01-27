import { db } from '../src/db';
import { roles, rolePermissions, permissions } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { getDatabaseDialect } from '../src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dialect = getDatabaseDialect();

async function addFilePermissions() {
  console.log('=== 添加文件管理权限 ===\n');

  try {
    // 1. 查找超级管理员角色
    const superRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, '超级管理员'))
      .limit(1);

    if (!superRole.length) {
      console.error('❌ 未找到超级管理员角色');
      process.exit(1);
    }

    const roleId = superRole[0].id;
    console.log('✓ 找到超级管理员角色，ID:', roleId);

    // 2. 查找system权限组
    const systemPerm = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, 'system'))
      .limit(1);

    if (!systemPerm.length) {
      console.error('❌ 未找到system权限组');
      process.exit(1);
    }

    const systemId = systemPerm[0].id;
    console.log('✓ 找到system权限组，ID:', systemId);

    // 3. 检查是否已存在文件管理权限
    const existingFilePerms = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, 'system.file'));

    if (existingFilePerms.length > 0) {
      console.log('⚠️  文件管理权限已存在，跳过创建');
      process.exit(0);
    }

    // 4. 添加文件管理权限
    console.log('\n开始添加文件管理权限...');

    const filePermissions = [
      {
        id: 22,
        name: '文件管理',
        code: 'system.file',
        description: '文件管理权限',
        parentId: systemId,
        sortOrder: 220
      },
      {
        id: 221,
        name: '查看文件',
        code: 'system.file.read',
        description: '查看文件列表和详情',
        parentId: 22,
        sortOrder: 221
      },
      {
        id: 222,
        name: '上传文件',
        code: 'system.file.upload',
        description: '上传文件',
        parentId: 22,
        sortOrder: 222
      },
      {
        id: 223,
        name: '删除文件',
        code: 'system.file.delete',
        description: '删除文件',
        parentId: 22,
        sortOrder: 223
      },
      {
        id: 224,
        name: '创建文件夹',
        code: 'system.file.folder.create',
        description: '创建文件夹',
        parentId: 22,
        sortOrder: 224
      },
      {
        id: 225,
        name: '删除文件夹',
        code: 'system.file.folder.delete',
        description: '删除文件夹',
        parentId: 22,
        sortOrder: 225
      }
    ];

    // 5. 插入权限
    const insertedIds = [];
    for (const perm of filePermissions) {
      const [result] = await (dialect === 'postgres'
        ? db.insert(permissions).values(perm).returning({ id: permissions.id })
        : db.insert(permissions).values(perm).$returningId());
      insertedIds.push(result.id);
      console.log(`  ✓ [${result.id}] ${perm.code}`);
    }

    console.log(`\n✓ 成功添加 ${insertedIds.length} 个文件管理权限`);

    // 6. 为超级管理员角色添加权限关联
    console.log('\n为超级管理员角色添加权限关联...');
    await db.insert(rolePermissions).values(
      insertedIds.map((permissionId) => ({
        roleId: roleId,
        permissionId: permissionId
      }))
    );

    console.log(`✓ 成功添加 ${insertedIds.length} 个权限关联`);

    // 7. 验证结果
    console.log('\n验证结果...');
    const allPerms = await db.select().from(permissions);
    const allRolePerms = await db.select().from(rolePermissions);

    console.log(`✓ permissions 表: ${allPerms.length} 条记录`);
    console.log(`✓ role_permissions 表: ${allRolePerms.length} 条记录`);

    // 检查文件管理权限
    const filePerms = allPerms.filter((p: any) => p.code.startsWith('system.file'));
    console.log(`✓ 文件管理权限: ${filePerms.length} 条`);

    if (filePerms.length === 6) {
      console.log('\n✅ 文件管理权限添加成功！');
      console.log('\n下一步：');
      console.log('1. 清除浏览器缓存');
      console.log('2. 重新登录 admin@example.com');
      console.log('3. 检查"系统管理"菜单中是否显示"文件管理"');
    } else {
      console.log('\n⚠️  文件管理权限数量不正确');
      console.log(`   期望: 6, 实际: ${filePerms.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 添加权限失败:', error);
    process.exit(1);
  }
}

addFilePermissions();
