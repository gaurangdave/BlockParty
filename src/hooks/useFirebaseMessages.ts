import { useEffect } from "react";
import { database } from "../lib/firebase";
import { useMessagesStore } from "../store/useMessagesStore";
import { onValue, ref, set, update, push } from "firebase/database";

export function useFirebaseMessages() {
  const setMessages = useMessagesStore((state) => state.setMessages);

  useEffect(() => {
    const messagesRef = ref(database, "messages");

    // Listen to all messages under /messages
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // data is an object like { userId1: { text, isRead, timestamp }, userId2: ... }
        Object.keys(data).forEach((userId) => {
          setMessages(userId, data[userId]);
        });
      } else {
        // No messages
        useMessagesStore.setState({ messages: {} });
      }
    });

    return () => unsubscribe();
  }, [setMessages]);

  const sendReply = async (userId: string, text: string) => {
    try {
      // 1. Push reply to /replies/{userId}
      const repliesRef = ref(database, `replies/${userId}`);
      const newReplyRef = push(repliesRef);
      await set(newReplyRef, {
        from: "admin",
        text,
        timestamp: Date.now(),
      });

      // 2. Mark original message as read
      const messageRef = ref(database, `messages/${userId}`);
      await update(messageRef, {
        isRead: true,
      });
      // Optionally update local state too (done via listener anyway)
      useMessagesStore.getState().markAsRead(userId);
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  return { sendReply };
}
