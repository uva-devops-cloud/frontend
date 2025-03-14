import { getAuthHeaders } from '../resources/AuthUtility';

// Base API URL
const apiUrl = 'https://d1npgfnzouv53u.cloudfront.net/api'; // Use your actual API endpoint

/**
 * Updates user profile attributes through the backend API
 * This works for both SSO and non-SSO users
 */
export const updateUserProfile = async (attributes: Array<{ Name: string; Value: string }>) => {
    try {
        const headers = await getAuthHeaders();

        const response = await fetch(`${apiUrl}/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ attributes })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};