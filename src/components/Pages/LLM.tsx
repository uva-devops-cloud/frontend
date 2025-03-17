import React, { useState, useEffect } from "react";
import UserPool from "../resources/Cognito"; // Import UserPool directly

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

    try {
      setIsLoading(true);
      const userMessage: Message = { 
        text: input, 
        sender: "user",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Get the API URL from environment variable or use default
      const apiUrl = import.meta.env.VITE_API_URL || 'https://3q336xufi6.execute-api.eu-west-2.amazonaws.com/dev';
      console.log("Using API URL:", apiUrl);

      // Get user from Cognito User Pool
      const user = UserPool.getCurrentUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }
      
      console.log("Current user:", user);
      
      // Get session token directly
      const token = await new Promise((resolve, reject) => {
        user.getSession((err: Error | null, session: any) => {
          if (err) {
            console.error("Session error:", err);
            reject(err);
            return;
          }
          if (!session) {
            console.error("No session found");
            reject(new Error("No session found"));
            return;
          }
          console.log("Session obtained:", session);
          
          // For debugging - log all available token types
          try {
            console.log("ID Token:", session.getIdToken().getJwtToken().substring(0, 20) + "...");
            console.log("Access Token:", session.getAccessToken().getJwtToken().substring(0, 20) + "...");
            console.log("Refresh Token:", session.getRefreshToken().getToken().substring(0, 20) + "...");
            
            // Log token payload for debugging scopes
            const payload = session.getAccessToken().decodePayload();
            console.log("Access Token scopes:", payload.scope);
            console.log("Access Token client_id:", payload.client_id);
          } catch (e) {
            console.error("Error accessing token details:", e);
          }
          
          // Use the access token for API calls
          const jwtToken = session.getAccessToken().getJwtToken();
          console.log("Auth token being used:", jwtToken.substring(0, 20) + "...");
          resolve(jwtToken);
        });
      });

      // Try with different auth header formats to debug
      const authHeaders = {
        // Standard format
        "Authorization": `Bearer ${token}`,
      };
      
      console.log("Making API request to:", `${apiUrl}/query`);
      console.log("Using headers:", JSON.stringify(authHeaders));
      
      // Fetch response from the API endpoint with Authorization header
      const response = await fetch(`${apiUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({
          message: input
        }),
      });

      if (!response.ok) {
        console.error("API response not OK:", response.status, response.statusText);
        // Try to get the error body
        try {
          const errorBody = await response.text();
          console.error("Error response body:", errorBody);
        } catch (e) {
          console.error("Failed to read error body");
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: QueryResponse = await response.json();
      console.log("API response:", data);

      // Handle the API response
      if (data.status === 'complete' && data.answer) {
        // If we got a direct answer, display it immediately
        addBotMessage(data.answer);
        setIsLoading(false);
        setCorrelationId(null);
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else if (data.correlationId) {
        // Store the correlationId for status polling
        setCorrelationId(data.correlationId);
      } else {
        throw new Error("Invalid response from API");
      }
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkQueryStatus = async (id: string) => {
    try {
      // Get token directly from Cognito
      const user = UserPool.getCurrentUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }
      
      console.log("Current user:", user);
      
      // Get session token directly
      const token = await new Promise((resolve, reject) => {
        user.getSession((err: Error | null, session: any) => {
          if (err) {
            console.error("Session error:", err);
            reject(err);
            return;
          }
          if (!session) {
            console.error("No session found");
            reject(new Error("No session found"));
            return;
          }
          console.log("Session obtained:", session);
          
          // For debugging - log all available token types
          try {
            console.log("ID Token:", session.getIdToken().getJwtToken().substring(0, 20) + "...");
            console.log("Access Token:", session.getAccessToken().getJwtToken().substring(0, 20) + "...");
            console.log("Refresh Token:", session.getRefreshToken().getToken().substring(0, 20) + "...");
            
            // Log token payload for debugging scopes
            const payload = session.getAccessToken().decodePayload();
            console.log("Access Token scopes:", payload.scope);
            console.log("Access Token client_id:", payload.client_id);
          } catch (e) {
            console.error("Error accessing token details:", e);
          }
          
          // Use the access token for API calls
          const jwtToken = session.getAccessToken().getJwtToken();
          console.log("Auth token being used:", jwtToken.substring(0, 20) + "...");
          resolve(jwtToken);
        });
      });

      console.log("Making API request to:", `${apiUrl}/query/${id}`);
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
