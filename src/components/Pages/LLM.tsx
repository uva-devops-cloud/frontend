import React, { useState } from "react";
import { getAuthToken } from "../resources/AuthUtility"; // Import your auth utility

interface Message {
  text: string;
  sender: "user" | "bot";
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://3q336xufi6.execute-api.eu-west-2.amazonaws.com/dev";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Append the user's message
    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get the JWT token from local storage or auth context
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Fetch response from the API endpoint with Authorization header
      const response = await fetch(`${apiUrl}/hello`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Create bot message from API response
      const botMessage: Message = {
        text: data.message || "Sorry, I couldn't get a response",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching from API:", error);
      // Show error message
      const errorMessage: Message = {
        text: "Sorry, there was an error connecting to the service. Please try again.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messageContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...(msg.sender === "user"
                ? styles.userMessage
                : styles.botMessage),
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div style={{ ...styles.botMessage, alignSelf: "flex-start" }}>
            Thinking...
          </div>
        )}
      </div>
      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          style={styles.input}
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          style={{ ...styles.button, opacity: isLoading ? 0.7 : 1 }}
          type="submit"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatContainer: {
    width: "100%",
    maxWidth: "600px",
    height: "500px",
    margin: "0 auto",
    border: "1px solid #ddd",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8f9fa",
    fontFamily: "Arial, sans-serif",
    overflow: "hidden",
  },
  messageContainer: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  form: {
    display: "flex",
    borderTop: "1px solid #ddd",
  },
  input: {
    flex: 1,
    border: "none",
    padding: "10px",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
  userMessage: {
    margin: "5px",
    backgroundColor: "#d1e7dd",
    padding: "8px 12px",
    borderRadius: "16px",
    maxWidth: "70%",
    wordBreak: "break-word",
  },
  botMessage: {
    margin: "5px",
    backgroundColor: "#e2e3e5",
    padding: "8px 12px",
    borderRadius: "16px",
    maxWidth: "70%",
    wordBreak: "break-word",
  },
};

export default ChatInterface;