import UserPool from './Cognito';
import { CognitoUserSession } from 'amazon-cognito-identity-js';

// Store the JWT token in localStorage
export const setAuthToken = (token: string): void => {
    try {
        localStorage.setItem('authToken', token);
    } catch (error) {
        console.error('Error setting auth token:', error);
        // Could implement fallback storage method here if needed
    }
};

// Get the stored JWT token
export const getAuthToken = (): string | null => {
    try {
        return localStorage.getItem('authToken');
    } catch (error) {
        console.error('Error accessing localStorage:', error);
        return null;
    }
};

// Remove the token (for logout)
export const removeAuthToken = (): void => {
    try {
        localStorage.removeItem('authToken');
    } catch (error) {
        console.error('Error removing auth token:', error);
    }
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
                    
                    // Try to store the token in localStorage for future use
                    try {
                        const token = session.getAccessToken().getJwtToken();
                        setAuthToken(token);
                    } catch (error) {
                        console.error('Unable to store token in localStorage:', error);
                    }
                    
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

// Get authenticated headers with JWT token - safely handles localStorage errors
export const getAuthHeaders = async (): Promise<HeadersInit> => {
    try {
        // First try to get token from direct Cognito session (most reliable)
        const session = await getCurrentSession();
        const token = session.getAccessToken().getJwtToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    } catch (sessionError) {
        console.error('Error getting Cognito session:', sessionError);
        
        // Fallback: try to get from localStorage if available
        try {
            const token = getAuthToken();
            if (token) {
                return {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            }
        } catch (storageError) {
            console.error('Error accessing token from storage:', storageError);
        }
        
        throw new Error('Authentication required');
    }
};

// Complete logout function that cleans up Cognito session
export const logOut = (): void => {
    const user = UserPool.getCurrentUser();
    if (user) {
        user.signOut();
    }
    
    try {
        removeAuthToken();
    } catch (error) {
        console.error('Error removing auth token during logout:', error);
    }
};