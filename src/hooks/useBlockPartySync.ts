import { useEffect, useState } from "react";
import { ref, onChildAdded, DataSnapshot } from "firebase/database";
import { database } from "../lib/firebase";

export interface UserData {
  id: string; // The key from Firebase RTDB
  username: string;
  colorPalette?: {
    skin?: string;
    shirt?: string;
    pants?: string;
    shoes?: string;
  };
  position: [number, number, number];
}

export function useBlockPartySync() {
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);

  useEffect(() => {
    console.log("📡 Setting up Firebase RTDB listener for /users");
    const usersRef = ref(database, "users");

    // Listen for new child items added to the /users node
    const unsubscribe = onChildAdded(usersRef, (data: DataSnapshot) => {
      const val = data.val();
      if (!val) return;

      console.log("👋 New user joined:", data.key, val);

      const newUser: UserData = {
        id: data.key as string,
        username: val.username || "Anonymous",
        colorPalette: val.colorPalette,
        // Default drop position if not provided by the payload
        position: val.position || [(Math.random() - 0.5) * 20, 15, 0],
      };

      // Ensure we don't add duplicates if react strict mode runs effects twice or events replay
      setActiveUsers((prev) => {
        if (prev.some((u) => u.id === newUser.id)) return prev;
        return [...prev, newUser];
      });
    });

    return () => {
      console.log("🧹 Tearing down Firebase RTDB listener");
      unsubscribe();
    };
  }, []);

  return { activeUsers };
}
