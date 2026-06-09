const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Database = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const db = new Database();

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 验证 JWT 中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未提供令牌' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err) {
    res.status(401).json({ error: '令牌无效' });
  }
};

// ==================== 用户相关 API ====================

// 注册
app.post('/api/auth/register', async (req, res) => {
  const { username, password, nickname } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  try {
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    await db.createUser({
      id: userId,
      username,
      password: hashedPassword,
      nickname: nickname || username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });
    
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId, username, nickname: nickname || username });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: '密码错误' });
    }
    
    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
app.get('/api/user/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId);
    res.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar
    });
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 搜索用户
app.get('/api/users/search', authMiddleware, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);
  
  try {
    const users = await db.searchUsers(query, req.userId);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// ==================== 好友相关 API ====================

// 发送好友请求
app.post('/api/friends/request', authMiddleware, async (req, res) => {
  const { targetUserId, message } = req.body;
  
  try {
    // 检查是否已经是好友
    const isFriend = await db.checkFriendship(req.userId, targetUserId);
    if (isFriend) {
      return res.status(400).json({ error: '已经是好友了' });
    }
    
    // 检查是否已有待处理请求
    const existingRequest = await db.getFriendRequest(req.userId, targetUserId);
    if (existingRequest) {
      return res.status(400).json({ error: '好友请求已存在' });
    }
    
    await db.createFriendRequest({
      id: uuidv4(),
      fromUserId: req.userId,
      toUserId: targetUserId,
      message: message || '请求添加你为好友'
    });
    
    // 通知目标用户
    const targetSocket = onlineUsers.get(targetUserId);
    if (targetSocket) {
      const fromUser = await db.getUserById(req.userId);
      io.to(targetSocket).emit('friend_request', {
        fromUserId: req.userId,
        fromUsername: fromUser.username,
        fromNickname: fromUser.nickname,
        fromAvatar: fromUser.avatar,
        message: message || '请求添加你为好友'
      });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('发送好友请求错误:', err);
    res.status(500).json({ error: '发送失败' });
  }
});

// 获取好友请求列表
app.get('/api/friends/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await db.getFriendRequests(req.userId);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: '获取失败' });
  }
});

// 处理好友请求
app.post('/api/friends/respond', authMiddleware, async (req, res) => {
  const { requestId, accept } = req.body;
  
  try {
    const request = await db.getFriendRequestById(requestId);
    if (!request || request.to_user_id !== req.userId) {
      return res.status(400).json({ error: '请求不存在' });
    }
    
    if (accept) {
      await db.addFriendship(request.from_user_id, request.to_user_id);
      
      // 通知双方
      const fromSocket = onlineUsers.get(request.from_user_id);
      const toUser = await db.getUserById(req.userId);
      if (fromSocket) {
        io.to(fromSocket).emit('friend_accepted', {
          userId: req.userId,
          username: toUser.username,
          nickname: toUser.nickname,
          avatar: toUser.avatar
        });
      }
    }
    
    await db.updateFriendRequestStatus(requestId, accept ? 'accepted' : 'rejected');
    res.json({ success: true });
  } catch (err) {
    console.error('处理好友请求错误:', err);
    res.status(500).json({ error: '处理失败' });
  }
});

// 获取好友列表
app.get('/api/friends', authMiddleware, async (req, res) => {
  try {
    const friends = await db.getFriends(req.userId);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: '获取失败' });
  }
});

// ==================== 企业微信二维码 API ====================

// 获取所有群聊二维码
app.get('/api/qrcodes', authMiddleware, async (req, res) => {
  try {
    const qrcodes = await db.getAllQRCodes();
    res.json(qrcodes);
  } catch (err) {
    res.status(500).json({ error: '获取失败' });
  }
});

// 搜索群聊二维码
app.get('/api/qrcodes/search', authMiddleware, async (req, res) => {
  const { query } = req.query;
  try {
    const qrcodes = await db.searchQRCodes(query);
    res.json(qrcodes);
  } catch (err) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 管理员：添加二维码
app.post('/api/qrcodes', authMiddleware, async (req, res) => {
  const { name, description, imageUrl, category } = req.body;
  
  try {
    await db.createQRCode({
      id: uuidv4(),
      name,
      description,
      imageUrl,
      category: category || 'general',
      createdBy: req.userId
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '添加失败' });
  }
});

// ==================== Socket.IO 实时通信 ====================

const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 用户上线
  socket.on('user_online', async ({ userId, token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.userId === userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        
        // 更新用户最后在线时间
        await db.updateUserLastSeen(userId);
        
        // 通知好友用户上线
        const friends = await db.getFriends(userId);
        friends.forEach(friend => {
          const friendSocket = onlineUsers.get(friend.id);
          if (friendSocket) {
            io.to(friendSocket).emit('friend_online', { userId });
          }
        });
        
        console.log(`用户 ${userId} 上线`);
      }
    } catch (err) {
      console.error('用户上线验证失败:', err);
    }
  });
  
  // 发送消息
  socket.on('send_message', async (data) => {
    const { toUserId, content, type = 'text' } = data;
    const fromUserId = socket.userId;
    
    if (!fromUserId) return;
    
    try {
      // 检查是否是好友
      const isFriend = await db.checkFriendship(fromUserId, toUserId);
      if (!isFriend) {
        socket.emit('error', { message: '对方不是您的好友' });
        return;
      }
      
      const message = {
        id: uuidv4(),
        fromUserId,
        toUserId,
        content,
        type,
        timestamp: new Date().toISOString()
      };
      
      await db.saveMessage(message);
      
      // 发送给接收者
      const toSocket = onlineUsers.get(toUserId);
      if (toSocket) {
        io.to(toSocket).emit('new_message', message);
      }
      
      // 确认发送成功
      socket.emit('message_sent', { messageId: message.id, tempId: data.tempId });
    } catch (err) {
      console.error('发送消息错误:', err);
      socket.emit('error', { message: '发送失败' });
    }
  });
  
  // 获取历史消息
  socket.on('get_history', async ({ withUserId, before, limit = 50 }) => {
    if (!socket.userId) return;
    
    try {
      const messages = await db.getMessages(socket.userId, withUserId, limit, before);
      socket.emit('history_messages', { withUserId, messages });
    } catch (err) {
      console.error('获取历史消息错误:', err);
    }
  });
  
  // 标记消息已读
  socket.on('mark_read', async ({ withUserId }) => {
    if (!socket.userId) return;
    
    try {
      await db.markMessagesAsRead(socket.userId, withUserId);
      
      // 通知发送者消息已读
      const fromSocket = onlineUsers.get(withUserId);
      if (fromSocket) {
        io.to(fromSocket).emit('messages_read', { byUserId: socket.userId });
      }
    } catch (err) {
      console.error('标记已读错误:', err);
    }
  });
  
  // 正在输入
  socket.on('typing', ({ toUserId, isTyping }) => {
    const toSocket = onlineUsers.get(toUserId);
    if (toSocket) {
      io.to(toSocket).emit('user_typing', { userId: socket.userId, isTyping });
    }
  });
  
  // 断开连接
  socket.on('disconnect', async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      await db.updateUserLastSeen(socket.userId);
      
      // 通知好友用户离线
      try {
        const friends = await db.getFriends(socket.userId);
        friends.forEach(friend => {
          const friendSocket = onlineUsers.get(friend.id);
          if (friendSocket) {
            io.to(friendSocket).emit('friend_offline', { userId: socket.userId });
          }
        });
      } catch (err) {
        console.error('通知好友离线错误:', err);
      }
      
      console.log(`用户 ${socket.userId} 离线`);
    }
  });
});

// 初始化数据库并启动服务器
const PORT = process.env.PORT || 3001;

// Vercel serverless 适配
if (process.env.VERCEL) {
  module.exports = server;
} else {
  db.init().then(() => {
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  }).catch(err => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });
}
