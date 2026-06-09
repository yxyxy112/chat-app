const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'chat.db'));
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 用户表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nickname TEXT NOT NULL,
            avatar TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME
          )
        `);

        // 好友关系表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS friendships (
            user_id TEXT NOT NULL,
            friend_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, friend_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (friend_id) REFERENCES users(id)
          )
        `);

        // 好友请求表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS friend_requests (
            id TEXT PRIMARY KEY,
            from_user_id TEXT NOT NULL,
            to_user_id TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_user_id) REFERENCES users(id),
            FOREIGN KEY (to_user_id) REFERENCES users(id)
          )
        `);

        // 消息表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            from_user_id TEXT NOT NULL,
            to_user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'text',
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_user_id) REFERENCES users(id),
            FOREIGN KEY (to_user_id) REFERENCES users(id)
          )
        `);

        // 企业微信群二维码表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS qrcodes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  // 用户相关方法
  createUser(user) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (id, username, password, nickname, avatar) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.username, user.password, user.nickname, user.avatar],
        function(err) {
          if (err) reject(err);
          else resolve(user.id);
        }
      );
    });
  }

  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  searchUsers(query, excludeUserId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, username, nickname, avatar FROM users 
         WHERE (username LIKE ? OR nickname LIKE ?) AND id != ?
         LIMIT 20`,
        [`%${query}%`, `%${query}%`, excludeUserId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  updateUserLastSeen(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 好友相关方法
  createFriendRequest(request) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO friend_requests (id, from_user_id, to_user_id, message) VALUES (?, ?, ?, ?)',
        [request.id, request.fromUserId, request.toUserId, request.message],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getFriendRequest(fromUserId, toUserId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = "pending"',
        [fromUserId, toUserId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getFriendRequestById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM friend_requests WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getFriendRequests(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT fr.*, u.username, u.nickname, u.avatar 
         FROM friend_requests fr
         JOIN users u ON fr.from_user_id = u.id
         WHERE fr.to_user_id = ? AND fr.status = 'pending'
         ORDER BY fr.created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  updateFriendRequestStatus(id, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE friend_requests SET status = ? WHERE id = ?',
        [status, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  addFriendship(userId1, userId2) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?), (?, ?)',
        [userId1, userId2, userId2, userId1],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  checkFriendship(userId1, userId2) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?',
        [userId1, userId2],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  getFriends(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT u.id, u.username, u.nickname, u.avatar, u.last_seen
         FROM friendships f
         JOIN users u ON f.friend_id = u.id
         WHERE f.user_id = ?`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // 消息相关方法
  saveMessage(message) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO messages (id, from_user_id, to_user_id, content, type) VALUES (?, ?, ?, ?, ?)',
        [message.id, message.fromUserId, message.toUserId, message.content, message.type],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getMessages(userId1, userId2, limit, before) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT * FROM messages 
        WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
      `;
      const params = [userId1, userId2, userId2, userId1];
      
      if (before) {
        query += ' AND created_at < ?';
        params.push(before);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);
      
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows || []).reverse());
      });
    });
  }

  markMessagesAsRead(toUserId, fromUserId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE messages SET is_read = 1 WHERE to_user_id = ? AND from_user_id = ? AND is_read = 0',
        [toUserId, fromUserId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 二维码相关方法
  createQRCode(qrcode) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO qrcodes (id, name, description, image_url, category, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [qrcode.id, qrcode.name, qrcode.description, qrcode.imageUrl, qrcode.category, qrcode.createdBy],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getAllQRCodes() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM qrcodes ORDER BY category, name',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  searchQRCodes(query) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM qrcodes WHERE name LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY name',
        [`%${query}%`, `%${query}%`, `%${query}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}

module.exports = Database;
