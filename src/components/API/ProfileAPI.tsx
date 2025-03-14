import { getAuthHeaders } from '../resources/AuthUtility';

// Base API URL
const apiUrl = import.meta.env.VITE_API_URL || 'https://3q336xufi6.execute-api.eu-west-2.amazonaws.com/dev';

/**
 * Updates user profile attributes through the backend API
 * This works for SSO users by using the admin Lambda function
 */
export const updateUserProfile = async (attributes: Array<{ Name: string; Value: string }>) => {
    try {
        console.log('Updating profile via API:', apiUrl);
        console.log('Attributes:', attributes);

        const headers = await getAuthHeaders();
        console.log('Auth headers:', headers);

        const response = await fetch(`${apiUrl}/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ attributes })
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);

            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            } catch (e) {
                throw new Error(`API request failed with status ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating user profile via API:', error);
        throw error;
    }
};