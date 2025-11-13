'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: string;
  nickname: string;
}

interface UserContextType {
  user: User | null;
  login: (nickname: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'estimate_poker_user';
const USER_COOKIE_KEY = 'simple_login_user';

// Cookie操作のヘルパー関数
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ローカルストレージとCookieからユーザー情報を読み込む
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Cookieにも保存（既存のlocalStorageからの移行のため）
        setCookie(USER_COOKIE_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
        deleteCookie(USER_COOKIE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // ユーザー情報をローカルストレージとCookieに保存
  const saveUser = (userData: User) => {
    setUser(userData);
    const userJson = JSON.stringify(userData);
    localStorage.setItem(USER_STORAGE_KEY, userJson);
    setCookie(USER_COOKIE_KEY, userJson);
  };

  // ログイン（ユーザー作成）
  const login = async (nickname: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const data = await response.json();
      saveUser(data);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // ログアウト
  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    deleteCookie(USER_COOKIE_KEY);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
