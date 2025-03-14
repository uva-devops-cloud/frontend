import UserPool from './Cognito';
import { CognitoUserSession } from 'amazon-cognito-identity-js';

// Store the JWT token in localStorage
export const setAuthToken = (token: string): void => {
    localStorage.setItem('authToken', token);
};

// Get the stored JWT token
export const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// Remove the token (for logout)
export const removeAuthToken = (): void => {
    localStorage.removeItem('authToken');
};

// Get current authenticated user session
export const getCurrentSession = async (): Promise<CognitoUserSession> => {
    return new Promise((resolve, reject) => {
        // Check for Cognito session
        const user = UserPool.getCurrentUser();
        if (user) {
            user.getSession((err: Error | null, session: CognitoUserSession | null) => {
                if (err) {
                    console.error("Session error:", err);
                    reject(err);
                    return;
                }

                if (session && session.isValid()) {
                    console.log("Valid session found");
                    resolve(session);
                } else {
                    console.error("Invalid session");
                    reject(new Error('Invalid session'));
                }
            });
        } else {
            console.error("No user found in Cognito user pool");
            reject(new Error('No user found'));
        }
    });
};

// Get authenticated headers with JWT token
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
        // Get the JWT token
        const session = await getCurrentSession();
        const token = session.getIdToken().getJwtToken();

        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    } catch (error) {
        console.error("Error getting authentication headers:", error);

        // Fallback: try to get token from localStorage
        const idToken = localStorage.getItem('idToken');
        if (idToken) {
            return {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            };
        }

        throw new Error("Failed to get authentication headers");
    }
};

// Complete logout function that cleans up Cognito session
export const logOut = (): void => {
    // Sign out from Cognito if there's a user session
    const user = UserPool.getCurrentUser();
    if (user) {
        user.signOut();
    }
};