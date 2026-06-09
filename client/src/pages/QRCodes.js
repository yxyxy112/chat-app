import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiArrowLeft, FiSearch, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Container = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
`;

const SearchContainer = styled.div`
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
`;

const SearchBox = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SearchButton = styled.button`
  padding: 12px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;

  &:hover {
    background: #5a6fd6;
  }
`;

const Content = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const CategorySection = styled.div`
  margin-bottom: 24px;
`;

const CategoryTitle = styled.h2`
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 4px solid #667eea;
`;

const QRGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const QRCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

const QRImage = styled.img`
  width: 100%;
  height: 280px;
  object-fit: cover;
  background: #f0f0f0;
`;

const QRInfo = styled.div`
  padding: 16px;
`;

const QRName = styled.h3`
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
`;

const QRDescription = styled.p`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

const QRCategory = styled.span`
  display: inline-block;
  padding: 4px 12px;
  background: #e8eaff;
  color: #667eea;
  border-radius: 20px;
  font-size: 12px;
  margin-top: 12px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

// 模态框
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const ModalImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  background: #f5f5f5;
`;

const ModalInfo = styled.div`
  padding: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
`;

const ModalDescription = styled.p`
  color: #666;
  line-height: 1.6;
`;

function QRCodes() {
  const navigate = useNavigate();
  const [qrcodes, setQrcodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQR, setSelectedQR] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      const response = await axios.get('/api/qrcodes');
      setQrcodes(response.data);
    } catch (err) {
      console.error('获取二维码失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchQRCodes();
      return;
    }
    try {
      const response = await axios.get(`/api/qrcodes/search?query=${searchQuery}`);
      setQrcodes(response.data);
    } catch (err) {
      console.error('搜索失败:', err);
    }
  };

  // 按分类分组
  const groupedQRCodes = qrcodes.reduce((acc, qr) => {
    const category = qr.category || '未分类';
    if (!acc[category]) acc[category] = [];
    acc[category].push(qr);
    return acc;
  }, {});

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          <FiArrowLeft size={20} />
        </BackButton>
        <Title>企业微信群二维码</Title>
      </Header>

      <SearchContainer>
        <SearchBox>
          <SearchInput
            placeholder="搜索群聊名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <SearchButton onClick={handleSearch}>
            <FiSearch size={18} /> 搜索
          </SearchButton>
        </SearchBox>
      </SearchContainer>

      <Content>
        {loading ? (
          <EmptyState>
            <EmptyIcon>⏳</EmptyIcon>
            <p>加载中...</p>
          </EmptyState>
        ) : qrcodes.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📱</EmptyIcon>
            <p>暂无群二维码</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>请联系管理员添加</p>
          </EmptyState>
        ) : (
          Object.entries(groupedQRCodes).map(([category, items]) => (
            <CategorySection key={category}>
              <CategoryTitle>{category}</CategoryTitle>
              <QRGrid>
                {items.map(qr => (
                  <QRCard key={qr.id} onClick={() => setSelectedQR(qr)}>
                    <QRImage src={qr.image_url} alt={qr.name} />
                    <QRInfo>
                      <QRName>{qr.name}</QRName>
                      <QRDescription>{qr.description}</QRDescription>
                      <QRCategory>{qr.category}</QRCategory>
                    </QRInfo>
                  </QRCard>
                ))}
              </QRGrid>
            </CategorySection>
          ))
        )}
      </Content>

      {selectedQR && (
        <Modal onClick={() => setSelectedQR(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalClose onClick={() => setSelectedQR(null)}>
              <FiX size={20} />
            </ModalClose>
            <ModalImage src={selectedQR.image_url} alt={selectedQR.name} />
            <ModalInfo>
              <ModalTitle>{selectedQR.name}</ModalTitle>
              <ModalDescription>{selectedQR.description}</ModalDescription>
            </ModalInfo>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default QRCodes;
