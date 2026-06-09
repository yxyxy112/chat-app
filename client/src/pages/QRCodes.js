import React, { useState } from 'react';
import styled from 'styled-components';
import { FiArrowLeft, FiSearch, FiX, FiMessageCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
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

const Content = styled.div`
  padding: 40px 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const SearchCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const SearchIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  font-size: 36px;
`;

const SearchTitle = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 8px;
  font-size: 24px;
`;

const SearchSubtitle = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 32px;
  font-size: 14px;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const InputLabel = styled.label`
  display: block;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
`;

const OrderInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 2px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
    letter-spacing: normal;
  }
`;

const SearchButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: #fff5f5;
  color: #e53e3e;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// 二维码弹窗
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
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  overflow: hidden;
  position: relative;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  margin: 0;
`;

const ModalOrderNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-top: 8px;
  opacity: 0.9;
`;

const ModalBody = styled.div`
  padding: 24px;
  text-align: center;
`;

const QRImage = styled.img`
  width: 240px;
  height: 240px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const QRDescription = styled.p`
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
`;

const QRHint = styled.p`
  color: #999;
  font-size: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

function QRCodes() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrResult, setQrResult] = useState(null);

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      setError('请输入订单号码');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 调用 API 查询订单对应的二维码
      const response = await axios.get(`/api/qrcodes/order/${orderNumber.trim()}`);
      
      if (response.data) {
        setQrResult(response.data);
      } else {
        setError('未找到该订单的群二维码');
      }
    } catch (err) {
      console.error('查询失败:', err);
      setError(err.response?.data?.error || '查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          <FiArrowLeft size={20} />
        </BackButton>
        <Title>加入企业微信群</Title>
      </Header>

      <Content>
        <SearchCard>
          <SearchIcon>
            <FiMessageCircle />
          </SearchIcon>
          <SearchTitle>查询群二维码</SearchTitle>
          <SearchSubtitle>输入您的订单号码，获取专属企业微信群二维码</SearchSubtitle>

          <InputGroup>
            <InputLabel>订单号码</InputLabel>
            <OrderInput
              placeholder="请输入订单号"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={20}
            />
          </InputGroup>

          <SearchButton onClick={handleSearch} disabled={loading}>
            {loading ? <LoadingSpinner /> : <><FiSearch size={18} /> 查询二维码</>}
          </SearchButton>

          {error && (
            <ErrorMessage>
              ⚠️ {error}
            </ErrorMessage>
          )}
        </SearchCard>
      </Content>

      {qrResult && (
        <Modal onClick={() => setQrResult(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalClose onClick={() => setQrResult(null)}>
              <FiX size={20} />
            </ModalClose>
            <ModalHeader>
              <ModalTitle>订单专属服务群</ModalTitle>
              <ModalOrderNumber>#{qrResult.orderNumber || orderNumber}</ModalOrderNumber>
            </ModalHeader>
            <ModalBody>
              <QRImage src={qrResult.imageUrl} alt="群二维码" />
              <QRDescription>{qrResult.description || '请使用微信扫描上方二维码加入群聊'}</QRDescription>
              <QRHint>💡 提示：二维码7天内有效，请尽快加入</QRHint>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default QRCodes;
