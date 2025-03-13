import UserPool from './Cognito'; // Update the path to the correct location of the Cognito module
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

// Define a type that represents both session types
interface SessionLike {
    isValid(): boolean;
    getIdToken(): { getJwtToken(): string };
    getAccessToken(): { getJwtToken(): string };
}

// Get current authenticated user session
export const getCurrentSession = async (): Promise<SessionLike> => {
    return new Promise((resolve, reject) => {
        // First, try the standard Cognito session check
        const user = UserPool.getCurrentUser();
        if (user) {
            user.getSession((err: Error | null, session: CognitoUserSession | null) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(session as SessionLike);
            });
        }
        // If no Cognito session but we have tokens from Google SSO
        else if (localStorage.getItem('accessToken') && localStorage.getItem('idToken')) {
            resolve({
                isValid: () => true,
                getIdToken: () => ({
                    getJwtToken: () => localStorage.getItem('idToken') || ''
                }),
                getAccessToken: () => ({
                    getJwtToken: () => localStorage.getItem('accessToken') || ''
                })
            });
        }
        // No valid session found
        else {
            reject(new Error('No user found'));
        }
    });
};

// Get authenticated headers with JWT token
export const getAuthHeaders = async (): Promise<HeadersInit> => {
    // First try from localStorage for performance
    const storedToken = getAuthToken();
    if (storedToken) {
        return {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
        };
    }

    // If not in localStorage, try to get from current session
    try {
        const session = await getCurrentSession();
        const token = session.getAccessToken().getJwtToken();
        setAuthToken(token); // Store for future use
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    } catch (error) {
        console.error('Not authenticated', error);
        throw new Error('Authentication required');
    }
};

// Complete logout function that cleans up all auth tokens
export const logOut = (): void => {
    // Sign out from Cognito if there's a user session
    const user = UserPool.getCurrentUser();
    if (user) {
        user.signOut();
    }

    // Remove all tokens from localStorage
    removeAuthToken();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');

    // Additional cleanup if needed
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    if (clientId) {
        // Clean up Cognito's specific storage pattern
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('CognitoIdentityServiceProvider') && key.includes(clientId)) {
                localStorage.removeItem(key);
            }
        }
    }
};