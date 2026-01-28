/**
 * 数据库连接诊断脚本
 * 用于检查数据库配置和连接状态
 */

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { createConnection } from 'mysql2/promise';
import { getDatabaseDialect } from '../src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function checkPostgresConnection() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionTimeoutMillis: 5000
  });

  try {
    console.log('🔍 检查 PostgreSQL 连接...');
    console.log(`   主机: ${process.env.DATABASE_HOST || 'localhost'}`);
    console.log(`   端口: ${process.env.DATABASE_PORT || 5432}`);
    console.log(`   数据库: ${process.env.DATABASE_NAME}`);
    console.log(`   用户: ${process.env.DATABASE_USERNAME}`);

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL 连接成功！');
    console.log(`   服务器时间: ${result.rows[0].now}`);
    client.release();
    await pool.end();
    return true;
  } catch (error: any) {
    console.error('❌ PostgreSQL 连接失败:');
    console.error(`   错误: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 提示: 数据库服务可能未运行，请启动 PostgreSQL 服务');
    } else if (error.code === '28P01') {
      console.error('   💡 提示: 用户名或密码错误');
    } else if (error.code === '3D000') {
      console.error('   💡 提示: 数据库不存在，请先创建数据库');
    }
    await pool.end();
    return false;
  }
}

async function checkMysqlConnection() {
  try {
    console.log('🔍 检查 MySQL 连接...');
    console.log(`   主机: ${process.env.DATABASE_HOST || 'localhost'}`);
    console.log(`   端口: ${process.env.DATABASE_PORT || 3306}`);
    console.log(`   数据库: ${process.env.DATABASE_NAME}`);
    console.log(`   用户: ${process.env.DATABASE_USERNAME}`);

    const connection = await createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectTimeout: 5000
    });

    const [rows] = await connection.query('SELECT NOW() as now');
    console.log('✅ MySQL 连接成功！');
    console.log(`   服务器时间: ${(rows as any[])[0].now}`);
    await connection.end();
    return true;
  } catch (error: any) {
    console.error('❌ MySQL 连接失败:');
    console.error(`   错误: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 提示: 数据库服务可能未运行，请启动 MySQL 服务');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   💡 提示: 用户名或密码错误');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   💡 提示: 数据库不存在，请先创建数据库');
    }
    return false;
  }
}

async function main() {
  console.log('📊 数据库连接诊断工具\n');
  console.log('当前配置:');
  console.log(
    `  DATABASE_DIALECT: ${process.env.DATABASE_DIALECT || '未设置'}`
  );
  console.log(
    `  DATABASE_URL: ${process.env.DATABASE_URL ? '已设置' : '未设置'}`
  );
  console.log('');

  const dialect = getDatabaseDialect();
  console.log(`检测到的数据库类型: ${dialect}\n`);

  if (dialect === 'postgres') {
    await checkPostgresConnection();
  } else {
    await checkMysqlConnection();
  }

  console.log('\n📝 配置检查:');
  if (!process.env.DATABASE_HOST) {
    console.warn('   ⚠️  DATABASE_HOST 未设置');
  }
  if (!process.env.DATABASE_NAME) {
    console.warn('   ⚠️  DATABASE_NAME 未设置');
  }
  if (!process.env.DATABASE_USERNAME) {
    console.warn('   ⚠️  DATABASE_USERNAME 未设置');
  }
  if (!process.env.DATABASE_PASSWORD) {
    console.warn('   ⚠️  DATABASE_PASSWORD 未设置');
  }
}

main().catch(console.error);
