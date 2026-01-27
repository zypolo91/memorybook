import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

let io: SocketIOServer | null = null;

// 用户Socket映射
const userSockets = new Map<number, Set<string>>();

export function initWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/socket'
  });

  io.on('connection', (socket: Socket) => {
    console.log('WebSocket客户端已连接:', socket.id);

    // 用户认证
    socket.on('authenticate', (userId: number) => {
      if (!userId) {
        socket.emit('error', { message: '用户ID无效' });
        return;
      }

      // 将socket与用户关联
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      socket.data.userId = userId;
      socket.join(`user:${userId}`);

      console.log(`用户 ${userId} 已认证，socket: ${socket.id}`);
      socket.emit('authenticated', { userId });
    });

    // 加入聊天房间
    socket.on(
      'join_chat',
      ({ userId, chatUserId }: { userId: number; chatUserId: number }) => {
        const roomId = getChatRoomId(userId, chatUserId);
        socket.join(roomId);
        console.log(`用户 ${userId} 加入聊天房间: ${roomId}`);
      }
    );

    // 离开聊天房间
    socket.on(
      'leave_chat',
      ({ userId, chatUserId }: { userId: number; chatUserId: number }) => {
        const roomId = getChatRoomId(userId, chatUserId);
        socket.leave(roomId);
        console.log(`用户 ${userId} 离开聊天房间: ${roomId}`);
      }
    );

    // 发送消息
    socket.on(
      'send_message',
      async (data: {
        senderId: number;
        receiverId: number;
        content: string;
        type?: string;
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        collectionId?: number;
        replyToId?: number;
      }) => {
        try {
          // 保存消息到数据库
          const [message] = await db
            .insert(messages)
            .values({
              senderId: data.senderId,
              receiverId: data.receiverId,
              content: data.content,
              type: data.type || 'text',
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              fileSize: data.fileSize,
              collectionId: data.collectionId,
              replyToId: data.replyToId,
              isRead: false,
              isDeleted: false
            })
            .returning();

          // 获取发送者信息
          const messageWithSender = await db.query.messages.findFirst({
            where: eq(messages.id, message.id),
            with: {
              sender: {
                columns: { id: true, username: true, avatar: true }
              }
            }
          });

          // 发送给房间内的所有用户
          const roomId = getChatRoomId(data.senderId, data.receiverId);
          io?.to(roomId).emit('new_message', messageWithSender);

          // 通知接收者有新消息（用于红点提示）
          io?.to(`user:${data.receiverId}`).emit('unread_message', {
            senderId: data.senderId,
            messageId: message.id
          });

          socket.emit('message_sent', {
            success: true,
            message: messageWithSender
          });
        } catch (error: any) {
          console.error('发送消息失败:', error);
          socket.emit('error', {
            message: '发送消息失败',
            error: error.message
          });
        }
      }
    );

    // 标记消息为已读
    socket.on(
      'mark_read',
      async ({
        userId,
        chatUserId
      }: {
        userId: number;
        chatUserId: number;
      }) => {
        try {
          await db
            .update(messages)
            .set({ isRead: true })
            .where(
              and(
                eq(messages.senderId, chatUserId),
                eq(messages.receiverId, userId),
                eq(messages.isRead, false)
              )
            );

          // 通知发送者消息已读
          io?.to(`user:${chatUserId}`).emit('messages_read', { userId });
        } catch (error: any) {
          console.error('标记已读失败:', error);
        }
      }
    );

    // 删除消息
    socket.on(
      'delete_message',
      async ({ messageId, userId }: { messageId: number; userId: number }) => {
        try {
          // 验证消息所有权
          const message = await db.query.messages.findFirst({
            where: eq(messages.id, messageId)
          });

          if (!message || message.senderId !== userId) {
            socket.emit('error', { message: '无权删除此消息' });
            return;
          }

          // 软删除
          await db
            .update(messages)
            .set({ isDeleted: true })
            .where(eq(messages.id, messageId));

          // 通知房间内的所有用户
          const roomId = getChatRoomId(message.senderId, message.receiverId);
          io?.to(roomId).emit('message_deleted', { messageId });

          socket.emit('message_deleted_success', { messageId });
        } catch (error: any) {
          console.error('删除消息失败:', error);
          socket.emit('error', {
            message: '删除消息失败',
            error: error.message
          });
        }
      }
    );

    // 用户正在输入
    socket.on(
      'typing',
      ({ userId, chatUserId }: { userId: number; chatUserId: number }) => {
        io?.to(`user:${chatUserId}`).emit('user_typing', { userId });
      }
    );

    // 用户停止输入
    socket.on(
      'stop_typing',
      ({ userId, chatUserId }: { userId: number; chatUserId: number }) => {
        io?.to(`user:${chatUserId}`).emit('user_stop_typing', { userId });
      }
    );

    // 断开连接
    socket.on('disconnect', () => {
      console.log('WebSocket客户端已断开:', socket.id);

      // 从用户映射中移除
      const userId = socket.data.userId;
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId)!.delete(socket.id);
        if (userSockets.get(userId)!.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
}

// 生成聊天房间ID（确保两个用户之间的房间ID一致）
function getChatRoomId(userId1: number, userId2: number): string {
  const [min, max] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  return `chat:${min}:${max}`;
}

// 获取Socket.IO实例
export function getIO(): SocketIOServer | null {
  return io;
}

// 向特定用户发送消息
export function emitToUser(userId: number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// 向聊天房间发送消息
export function emitToChatRoom(
  userId1: number,
  userId2: number,
  event: string,
  data: any
) {
  if (io) {
    const roomId = getChatRoomId(userId1, userId2);
    io.to(roomId).emit(event, data);
  }
}
