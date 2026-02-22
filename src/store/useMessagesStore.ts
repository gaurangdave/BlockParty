import { create } from "zustand";

interface Message {
  text: string;
  timestamp: number;
  isRead: boolean;
}

interface MessagesState {
  messages: Record<string, Message>;
  setMessages: (userId: string, message: Message | null) => void;
  markAsRead: (userId: string) => void;
  hasUnread: (userId: string) => boolean;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: {},
  setMessages: (userId, message) =>
    set((state) => {
      const newMessages = { ...state.messages };
      if (message) {
        newMessages[userId] = message;
      } else {
        delete newMessages[userId];
      }
      return { messages: newMessages };
    }),
  markAsRead: (userId) =>
    set((state) => {
      const msg = state.messages[userId];
      if (msg && !msg.isRead) {
        return {
          messages: {
            ...state.messages,
            [userId]: { ...msg, isRead: true },
          },
        };
      }
      return state;
    }),
  hasUnread: (userId) => {
    const msg = get().messages[userId];
    return msg ? !msg.isRead : false;
  },
}));
