"use client";

import { useState } from "react";
import { database } from "../../src/lib/firebase";
import { useBlockPartySync } from "../../src/hooks/useBlockPartySync";
import { ref, set } from "firebase/database";

export default function AdminPage() {
  const { activeUsers } = useBlockPartySync();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) return;

    try {
      const messageRef = ref(database, `messages/${selectedUser}`);
      await set(messageRef, {
        text: message.trim(),
        isRead: false,
        timestamp: Date.now(),
      });
      setMessage("");
      alert("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "40px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        color: "#333",
        pointerEvents: "auto",
        overflow: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#1a73e8",
            fontSize: "24px",
          }}
        >
          Admin Control Panel
        </h1>

        <form
          onSubmit={handleSendMessage}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>
              Select User:
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
                backgroundColor: "#fff",
                color: "#000",
              }}
            >
              <option value="" disabled>
                -- Choose a user --
              </option>
              {activeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>
              Message text:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want to tell them?"
              required
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
                minHeight: "100px",
                resize: "vertical",
                backgroundColor: "#fff",
                color: "#000",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!selectedUser || !message.trim()}
            style={{
              padding: "12px 16px",
              backgroundColor:
                !selectedUser || !message.trim() ? "#ccc" : "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor:
                !selectedUser || !message.trim() ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            Send Notification
          </button>
        </form>

        <div
          style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #eee",
          }}
        >
          <h2 style={{ fontSize: "16px", marginBottom: "10px", color: "#666" }}>
            Active Users Detected
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {activeUsers.length === 0 ? (
              <span
                style={{ fontSize: "14px", color: "#888", fontStyle: "italic" }}
              >
                No active users found. Wait for emulator or user to spawn.
              </span>
            ) : (
              activeUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#e8eaed",
                    border: "1px solid #dadce0",
                    color: "#3c4043",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {u.username}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
