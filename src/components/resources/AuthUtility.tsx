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

// Get current authenticated user session
export const getCurrentSession = (): Promise<CognitoUserSession> => {
    return new Promise((resolve, reject) => {
        const user = UserPool.getCurrentUser();
        if (user) {
            user.getSession((err: Error | null, session: CognitoUserSession | null) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (session) {
                    resolve(session);
                } else {
                    reject(new Error('No valid session'));
                }
            });
        } else {
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