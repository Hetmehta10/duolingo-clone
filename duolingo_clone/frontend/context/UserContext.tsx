"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserTopBar, UserListItem } from "@/lib/types";
import { getUser, getUsers } from "@/lib/api";

interface UserContextType {
  userId: number;
  user: UserTopBar | null;
  usersList: UserListItem[];
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  switchUser: (newUserId: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "duo_clone_selected_user_id";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number>(1);
  const [user, setUser] = useState<UserTopBar | null>(null);
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const list = await getUsers();
      setUsersList(list);
      return list;
    } catch (err) {
      console.error("Failed to load users list:", err);
      return [];
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const data = await getUser(userId);
      setUser(data);
      setError(null);
    } catch (err) {
      console.error(`Failed to load user ${userId}:`, err);
      setError("Failed to load user state");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const switchUser = useCallback(async (newUserId: number) => {
    setUserId(newUserId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newUserId.toString());
    }
    try {
      setIsLoading(true);
      const data = await getUser(newUserId);
      setUser(data);
      setError(null);
    } catch (err) {
      console.error(`Failed to load user ${newUserId}:`, err);
      setError("Failed to load user state");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let initialId = 1;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          initialId = parsed;
        }
      }
    }
    setUserId(initialId);

    fetchUsers().then((list) => {
      const targetId = list.some((u) => u.id === initialId) ? initialId : (list[0]?.id || 1);
      setUserId(targetId);
      getUser(targetId)
        .then((data) => {
          setUser(data);
          setError(null);
        })
        .catch((err) => {
          console.error("Initial user fetch failed:", err);
          setError("Failed to load user");
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  }, [fetchUsers]);

  return (
    <UserContext.Provider
      value={{
        userId,
        user,
        usersList,
        isLoading,
        error,
        refreshUser,
        switchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
