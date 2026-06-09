# Chat App - 即时通讯 Web 应用

一个功能完整的即时通讯 Web 应用，支持实时聊天、好友系统和企微群二维码查询。

## 功能特性

- 💬 **实时聊天** - 基于 Socket.IO 的即时消息传输
- 👥 **好友系统** - 添加好友、好友请求管理
- 🔍 **企微二维码** - 自助查询企业微信群聊二维码
- 🎨 **精美界面** - 现代化的 UI 设计
- 🔐 **用户认证** - JWT 身份验证
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 技术栈

### 后端
- Node.js + Express
- Socket.IO (实时通信)
- SQLite (数据库)
- JWT (身份认证)
- bcryptjs (密码加密)

### 前端
- React 18
- React Router
- styled-components (CSS-in-JS)
- Socket.IO Client
- Axios (HTTP 请求)
- date-fns (日期格式化)

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 2. 启动开发服务器

```bash
# 同时启动后端和前端
npm run dev

# 或分别启动
npm run server  # 后端: http://localhost:3001
npm run client  # 前端: http://localhost:3000
```

### 3. 生产部署

```bash
# 构建前端
cd client
npm run build
cd ..

# 启动生产服务器
npm start
```

## 项目结构

```
chat-app/
├── server/
│   ├── index.js          # 主服务器文件
│   ├── database.js       # 数据库操作
│   └── uploads/          # 上传文件目录
├── client/
│   ├── public/           # 静态资源
│   └── src/
│       ├── pages/        # 页面组件
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Chat.js
│       │   └── QRCodes.js
│       ├── contexts/     # React Context
│       │   ├── AuthContext.js
│       │   └── SocketContext.js
│       ├── App.js
│       └── index.js
├── package.json
└── README.md
```

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/user/me` - 获取当前用户信息

### 用户
- `GET /api/users/search?query=xxx` - 搜索用户

### 好友
- `GET /api/friends` - 获取好友列表
- `GET /api/friends/requests` - 获取好友请求
- `POST /api/friends/request` - 发送好友请求
- `POST /api/friends/respond` - 响应好友请求

### 企微二维码
- `GET /api/qrcodes` - 获取所有二维码
- `GET /api/qrcodes/search?query=xxx` - 搜索二维码
- `POST /api/qrcodes` - 添加二维码（管理员）

## 环境变量

```bash
PORT=3001                    # 服务器端口
JWT_SECRET=your-secret-key   # JWT 密钥
```

## 默认账号

注册一个新账号即可开始使用！

## 许可证

MIT
