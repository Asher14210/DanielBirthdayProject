import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

// 提供一个默认的假用户信息，供前端页面（如头像、用户名）展示使用
const mockUser = {
  id: 'demo-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: 'https://github.com/shadcn.png'
};

export const AuthProvider = ({ children }) => {
  // 1. 默认设置为已登录状态
  const [user, setUser] = useState(mockUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // 2. 将所有加载状态强制设为 false，避免页面加载卡顿/转圈
  const isLoadingAuth = false;
  const isLoadingPublicSettings = false;
  const authError = null;
  const authChecked = true;
  const appPublicSettings = {};

  // 3. 将登录/注销逻辑重置为纯前端提示，避免跳转或调 SDK
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    console.log('已退出登录（纯前端演示）');
  };

  const navigateToLogin = () => {
    setUser(mockUser);
    setIsAuthenticated(true);
    console.log('已模拟登录（纯前端演示）');
  };

  const checkUserAuth = async () => {};
  const checkAppState = async () => {};

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};