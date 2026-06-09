import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiMessageSquare, FiUsers, FiSearch, FiLogOut, FiGrid, FiBell } from 'react-icons/fi';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #f0f2f5;
`;

// 侧边栏
const Sidebar = styled.div`
  width: 300px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
`;

const UserInfo = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const UserStatus = styled.div`
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
`;

const NavMenu = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
`;

const NavItem = styled.button`
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: ${props => props.active ? '#667eea' : '#666'};
  border-bottom: 2px solid ${props => props.active ? '#667eea' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    color: #667eea;
    background: #f8f9fa;
  }
`;

const NavLabel = styled.span`
  font-size: 12px;
`;

const SearchBox = styled.div`
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  background: #f5f5f5 url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>') no-repeat 12px center;

  &:focus {
    outline: none;
    border-color: #667eea;
    background-color: #fff;
  }
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ListItem = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;

  &:hover {
    background: #f5f5f5;
  }

  ${props => props.active && `
    background: #e8eaff;
  `}
`;

const ListAvatar = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
`;

const ListInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ListName = styled.div`
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const OnlineIndicator = styled.span`
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  border: 2px solid #fff;
`;

const ListPreview = styled.div`
  font-size: 13px;
  color: #999;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.span`
  background: #ff4757;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

// 聊天区域
const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChatActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  padding: 8px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f5f5;
    color: #667eea;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MessageGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  ${props => props.isMe && `
    flex-direction: row-reverse;
  `}
`;

const MessageAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  max-width: 60%;
  ${props => props.isMe && `
    align-items: flex-end;
    display: flex;
    flex-direction: column;
  `}
`;

const MessageBubble = styled.div`
  padding: 12px 16px;
  border-radius: 16px;
  background: ${props => props.isMe ? '#667eea' : '#fff'};
  color: ${props => props.isMe ? '#fff' : '#333'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-break: break-word;
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 4px;
`;

const InputArea = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  resize: none;
  font-size: 14px;
  font-family: inherit;
  max-height: 120px;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5a6fd6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 16px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  opacity: 0.5;
`;

// 好友请求弹窗
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;

  &:hover {
    color: #333;
  }
`;

const RequestItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const RequestInfo = styled.div`
  flex: 1;
`;

const RequestMessage = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 4px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const AcceptButton = styled.button`
  padding: 6px 16px;
  background: #4ade80;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #22c55e;
  }
`;

const RejectButton = styled.button`
  padding: 6px 16px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #e0e0e0;
  }
`;

const AddFriendButton = styled.button`
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #5a6fd6;
  }
`;

function Chat() {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  // 获取好友列表
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get('/api/friends');
        setFriends(response.data);
      } catch (err) {
        console.error('获取好友列表失败:', err);
      }
    };
    fetchFriends();
  }, []);

  // Socket 事件监听
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      if (selectedFriend && (message.fromUserId === selectedFriend.id || message.toUserId === selectedFriend.id)) {
        setMessages(prev => [...prev, message]);
      } else {
        // 增加未读计数
        const fromId = message.fromUserId === user.userId ? message.toUserId : message.fromUserId;
        setUnreadCounts(prev => ({
          ...prev,
          [fromId]: (prev[fromId] || 0) + 1
        }));
      }
    });

    socket.on('friend_request', () => {
      fetchFriendRequests();
    });

    socket.on('friend_accepted', (friend) => {
      setFriends(prev => [...prev, friend]);
    });

    return () => {
      socket.off('new_message');
      socket.off('friend_request');
      socket.off('friend_accepted');
    };
  }, [socket, selectedFriend, user]);

  // 获取历史消息
  useEffect(() => {
    if (!selectedFriend || !socket) return;

    socket.emit('get_history', { withUserId: selectedFriend.id });
    socket.on('history_messages', ({ withUserId, messages: historyMessages }) => {
      if (withUserId === selectedFriend.id) {
        setMessages(historyMessages);
      }
    });

    // 标记已读
    socket.emit('mark_read', { withUserId: selectedFriend.id });
    setUnreadCounts(prev => ({ ...prev, [selectedFriend.id]: 0 }));

    return () => {
      socket.off('history_messages');
    };
  }, [selectedFriend, socket]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get('/api/friends/requests');
      setFriendRequests(response.data);
    } catch (err) {
      console.error('获取好友请求失败:', err);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedFriend || !socket) return;

    const tempId = Date.now().toString();
    socket.emit('send_message', {
      toUserId: selectedFriend.id,
      content: inputMessage.trim(),
      tempId
    });

    // 乐观更新
    const optimisticMessage = {
      id: tempId,
      fromUserId: user.userId,
      toUserId: selectedFriend.id,
      content: inputMessage.trim(),
      type: 'text',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setInputMessage('');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`/api/users/search?query=${searchQuery}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('搜索失败:', err);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      await axios.post('/api/friends/request', { targetUserId });
      alert('好友请求已发送');
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      alert(err.response?.data?.error || '发送失败');
    }
  };

  const handleRespondRequest = async (requestId, accept) => {
    try {
      await axios.post('/api/friends/respond', { requestId, accept });
      if (accept) {
        const response = await axios.get('/api/friends');
        setFriends(response.data);
      }
      fetchFriendRequests();
    } catch (err) {
      console.error('处理好友请求失败:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: zhCN });
    } catch {
      return '';
    }
  };

  return (
    <Container>
      <Sidebar>
        <UserInfo>
          <Avatar src={user?.avatar} alt={user?.nickname} />
          <UserDetails>
            <UserName>{user?.nickname || user?.username}</UserName>
            <UserStatus>
              <StatusDot /> 在线
            </UserStatus>
          </UserDetails>
          <IconButton onClick={() => navigate('/qrcodes')} title="企业微信群">
            <FiGrid size={20} />
          </IconButton>
          <IconButton onClick={() => { fetchFriendRequests(); setShowRequests(true); }} title="好友请求">
            <FiBell size={20} />
            {friendRequests.length > 0 && <UnreadBadge>{friendRequests.length}</UnreadBadge>}
          </IconButton>
          <IconButton onClick={logout} title="退出">
            <FiLogOut size={20} />
          </IconButton>
        </UserInfo>

        <NavMenu>
          <NavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
            <FiMessageSquare size={20} />
            <NavLabel>聊天</NavLabel>
          </NavItem>
          <NavItem active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>
            <FiUsers size={20} />
            <NavLabel>好友</NavLabel>
          </NavItem>
        </NavMenu>

        <SearchBox>
          <SearchInput
            placeholder={activeTab === 'chat' ? '搜索好友...' : '搜索用户添加好友...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </SearchBox>

        <ListContainer>
          {activeTab === 'chat' ? (
            friends.map(friend => (
              <ListItem
                key={friend.id}
                active={selectedFriend?.id === friend.id}
                onClick={() => setSelectedFriend(friend)}
              >
                <ListAvatar src={friend.avatar} alt={friend.nickname} />
                <ListInfo>
                  <ListName>
                    {friend.nickname || friend.username}
                    {onlineUsers.has(friend.id) && <OnlineIndicator />}
                  </ListName>
                  <ListPreview>{friend.last_seen ? '上次在线: ' + formatTime(friend.last_seen) : '离线'}</ListPreview>
                </ListInfo>
                {unreadCounts[friend.id] > 0 && (
                  <UnreadBadge>{unreadCounts[friend.id]}</UnreadBadge>
                )}
              </ListItem>
            ))
          ) : (
            <>
              {searchResults.length > 0 ? (
                searchResults.map(result => (
                  <ListItem key={result.id}>
                    <ListAvatar src={result.avatar} alt={result.nickname} />
                    <ListInfo>
                      <ListName>{result.nickname || result.username}</ListName>
                      <ListPreview>@{result.username}</ListPreview>
                    </ListInfo>
                    <AddFriendButton onClick={() => handleAddFriend(result.id)}>
                      <FiUsers size={14} /> 添加
                    </AddFriendButton>
                  </ListItem>
                ))
              ) : (
                friends.map(friend => (
                  <ListItem key={friend.id}>
                    <ListAvatar src={friend.avatar} alt={friend.nickname} />
                    <ListInfo>
                      <ListName>
                        {friend.nickname || friend.username}
                        {onlineUsers.has(friend.id) && <OnlineIndicator />}
                      </ListName>
                      <ListPreview>@{friend.username}</ListPreview>
                    </ListInfo>
                  </ListItem>
                ))
              )}
            </>
          )}
        </ListContainer>
      </Sidebar>

      <ChatArea>
        {selectedFriend ? (
          <>
            <ChatHeader>
              <ChatTitle>
                {selectedFriend.nickname || selectedFriend.username}
                {onlineUsers.has(selectedFriend.id) && (
                  <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'normal' }}>● 在线</span>
                )}
              </ChatTitle>
              <ChatActions>
                <IconButton>
                  <FiSearch size={18} />
                </IconButton>
              </ChatActions>
            </ChatHeader>

            <MessagesContainer>
              {messages.map((msg, index) => (
                <MessageGroup key={msg.id || index} isMe={msg.fromUserId === user.userId}>
                  <MessageAvatar
                    src={msg.fromUserId === user.userId ? user.avatar : selectedFriend.avatar}
                    alt=""
                  />
                  <MessageContent isMe={msg.fromUserId === user.userId}>
                    <MessageBubble isMe={msg.fromUserId === user.userId}>
                      {msg.content}
                    </MessageBubble>
                    <MessageTime>{formatTime(msg.timestamp)}</MessageTime>
                  </MessageContent>
                </MessageGroup>
              ))}
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <InputArea>
              <MessageInput
                placeholder="输入消息... (Enter 发送)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
              />
              <SendButton onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                发送
              </SendButton>
            </InputArea>
          </>
        ) : (
          <EmptyState>
            <EmptyIcon>💬</EmptyIcon>
            <p>选择一个好友开始聊天</p>
          </EmptyState>
        )}
      </ChatArea>

      {showRequests && (
        <Modal onClick={() => setShowRequests(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>好友请求</ModalTitle>
              <CloseButton onClick={() => setShowRequests(false)}>×</CloseButton>
            </ModalHeader>
            {friendRequests.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999' }}>暂无好友请求</p>
            ) : (
              friendRequests.map(request => (
                <RequestItem key={request.id}>
                  <ListAvatar src={request.avatar} alt={request.nickname} />
                  <RequestInfo>
                    <div style={{ fontWeight: 500 }}>{request.nickname || request.username}</div>
                    <RequestMessage>{request.message}</RequestMessage>
                  </RequestInfo>
                  <ActionButtons>
                    <AcceptButton onClick={() => handleRespondRequest(request.id, true)}>
                      接受
                    </AcceptButton>
                    <RejectButton onClick={() => handleRespondRequest(request.id, false)}>
                      拒绝
                    </RejectButton>
                  </ActionButtons>
                </RequestItem>
              ))
            )}
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default Chat;
