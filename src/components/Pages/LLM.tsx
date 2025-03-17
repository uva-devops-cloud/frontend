import React, { useState, useEffect } from "react";
import { getAuthToken } from "../resources/AuthUtility"; // Change to getAuthToken instead of getAuthHeaders

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp?: Date;
}

interface QueryResponse {
  correlationId: string;
  message: string;
  status: string;
  answer?: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://3q336xufi6.execute-api.eu-west-2.amazonaws.com/dev";

  // Clean up polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Poll for query status when we have a correlationId
  useEffect(() => {
    if (correlationId && isLoading) {
      const interval = setInterval(() => {
        checkQueryStatus(correlationId);
      }, 2000); // Poll every 2 seconds
      
      setPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [correlationId, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Append the user's message
    const userMessage: Message = { 
      text: input, 
      sender: "user",
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get the JWT token directly instead of using getAuthHeaders
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Fetch response from the API endpoint with Authorization header
      const response = await fetch(`${apiUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: input
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: QueryResponse = await response.json();
      
      // Store the correlationId for status polling
      setCorrelationId(data.correlationId);
      
      // If we have a direct answer (no worker lambdas needed)
      if (data.status === "complete" && data.answer) {
        addBotMessage(data.answer);
        setIsLoading(false);
        setCorrelationId(null);
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
      
      // Clear input field
      setInput("");
      
    } catch (error) {
      console.error("Error fetching from API:", error);
      // Show error message
      const errorMessage: Message = {
        text: "Sorry, there was an error connecting to the service. Please try again.",
        sender: "bot",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };
  
  const checkQueryStatus = async (id: string) => {
    try {
      // Get the JWT token directly
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Check status endpoint
      const response = await fetch(`${apiUrl}/query/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`Status API error: ${response.status}`);
      }
      
      const data: QueryResponse = await response.json();
      
      if (data.status === "complete" && data.answer) {
        addBotMessage(data.answer);
        setIsLoading(false);
        setCorrelationId(null);
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else if (data.status === "error") {
        addBotMessage(`Error processing your request: ${data.message}`);
        setIsLoading(false);
        setCorrelationId(null);
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
      // If status is still "processing", we'll continue polling
      
    } catch (err) {
      console.error("Error checking query status:", err);
      // Don't set error here, just log it and continue polling
    }
  };
  
  const addBotMessage = (text: string) => {
    const botMessage: Message = {
      text,
      sender: "bot",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMessage]);
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
            {msg.timestamp && (
              <div style={styles.timestamp}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ ...styles.botMessage, alignSelf: "flex-start" }}>
            <div style={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
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
  timestamp: {
    fontSize: "0.7rem",
    color: "#666",
    marginTop: "4px",
    textAlign: "right",
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
};

export default ChatInterface;
