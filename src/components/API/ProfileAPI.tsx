import { getAuthHeaders } from '../resources/AuthUtility';

// Base API URL - Use CloudFront path pattern when deployed
const isCloudFrontDomain = window.location.hostname.includes('cloudfront.net');
const apiUrl = isCloudFrontDomain
    ? '/api'  // Keep this as /api
    : (import.meta.env.VITE_API_URL || 'https://3q336xufi6.execute-api.eu-west-2.amazonaws.com/dev');

/**
 * Updates user profile attributes through the backend API
 * This works for SSO users by using the admin Lambda function
 */
export const updateUserProfile = async (attributes: Array<{ Name: string; Value: string }>) => {
    try {
        console.log('Updating profile via API:', apiUrl);

        const headers = await getAuthHeaders();

        // Try different API endpoints with fallback
        let endpoint, response;

        try {
            // First attempt without /profile
            endpoint = apiUrl;
            console.log('Trying endpoint:', endpoint);

            response = await fetch(endpoint, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ attributes })
            });

            console.log('First attempt status:', response.status);

            // If not successful, try with /profile
            if (!response.ok) {
                throw new Error('First attempt failed');
            }
        } catch (firstError) {
            // Second attempt with /profile
            endpoint = `${apiUrl}/profile`;
            console.log('Trying fallback endpoint:', endpoint);

            response = await fetch(endpoint, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ attributes })
            });

            console.log('Second attempt status:', response.status);
        }

        // Process response as before
        console.log('API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            console.error('Response headers:', Object.fromEntries([...response.headers]));

            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
                // Log the first 200 characters of the response for debugging
                console.error('Raw response preview:', errorText.substring(0, 200));
                throw new Error(`API request failed with status ${response.status}`);
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating user profile via API:', error);
        throw error;
    }
};