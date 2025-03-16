import { useEffect, useState } from 'react';
import { getCurrentSession } from '../resources/AuthUtility';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';

const MainPage = () => {
    const [cognitoAttributes, setAttributes] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSSOUser, setIsSSOUser] = useState(false);

    // Form state for editable fields
    const [formData, setFormData] = useState({
        givenName: '',
        familyName: '',
        address: '',
        birthdate: '',
        phoneNumber: ''
    });

    // Check for SSO user by inspecting token or local storage
    const checkIfSSOUser = () => {
        // Method 1: Check localStorage for clues
        const localStorageKeys = Object.keys(localStorage);
        const hasIdentitiesToken = localStorageKeys.some(key =>
            key.includes('CognitoIdentityServiceProvider') &&
            key.includes('accessToken'));

        if (hasIdentitiesToken) {
            // Find the actual token to parse
            const tokenKey = localStorageKeys.find(key =>
                key.includes('CognitoIdentityServiceProvider') &&
                key.includes('idToken'));

            if (tokenKey) {
                try {
                    const token = localStorage.getItem(tokenKey);
                    if (token) {
                        // Decode token payload
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        console.log('Token payload:', payload);

                        // Check for SSO signs in the token
                        if (payload.identities ||
                            (payload.username && payload.username.includes('Google_')) ||
                            (payload['cognito:groups'] && payload['cognito:groups'].includes('Google'))) {
                            console.log('✓ SSO user detected from token!');
                            return true;
                        }
                    }
                } catch (error) {
                    console.error('Error parsing token:', error);
                }
            }
        }

        // Method 2: Check the last auth user
        const lastAuthUserKey = localStorageKeys.find(key =>
            key.includes('CognitoIdentityServiceProvider') &&
            key.includes('LastAuthUser'));

        if (lastAuthUserKey) {
            const lastAuthUser = localStorage.getItem(lastAuthUserKey);
            if (lastAuthUser && lastAuthUser.startsWith('Google_')) {
                console.log('✓ SSO user detected from LastAuthUser!');
                return true;
            }
        }

        return false;
    };

    // Modified function to handle regular and SSO users differently
    const refreshUserAttributes = async () => {
        // First, check if this is an SSO user
        const isSSO = checkIfSSOUser();
        setIsSSOUser(isSSO);

        if (isSSO) {
            console.log('SSO user detected, using alternative attribute retrieval');
            // For SSO users, try to extract basic info from tokens instead
            try {
                // Find token in localStorage
                const tokenKey = Object.keys(localStorage).find(key =>
                    key.includes('CognitoIdentityServiceProvider') &&
                    key.includes('idToken'));

                if (tokenKey) {
                    const token = localStorage.getItem(tokenKey);
                    if (token) {
                        // Decode token payload
                        const payload = JSON.parse(atob(token.split('.')[1]));

                        // Create attributes object from token claims
                        const userAttributes = {
                            'email': payload.email || '',
                            'name': payload.name || '',
                            'given_name': payload.given_name || '',
                            'family_name': payload.family_name || '',
                            'sub': payload.sub || ''
                        };

                        setAttributes(userAttributes);

                        // Initialize form data with current values
                        setFormData({
                            givenName: userAttributes.given_name || '',
                            familyName: userAttributes.family_name || '',
                            address: '',  // SSO doesn't provide these
                            birthdate: '',
                            phoneNumber: ''
                        });

                        setIsLoading(false);
                        return;
                    }
                }

                // Fallback to minimal attributes if token parsing fails
                setAttributes({
                    'email': 'Your Google Account',
                    'name': 'Google SSO User',
                });

                setIsLoading(false);

            } catch (error) {
                console.error('Error retrieving SSO user attributes:', error);
                setIsLoading(false);
            }
            return;
        }

        // For regular Cognito users, use the standard approach
        const user = UserPool.getCurrentUser();
        if (!user) {
            console.log('No current user found');
            setIsLoading(false);
            return;
        }

        try {
            // Use a Promise-based approach for better async handling
            await new Promise((resolve, reject) => {
                user.getSession((err: Error | null, session: any) => {
                    if (err) reject(err);
                    else resolve(session);
                });
            });

            const attributes: any[] = await new Promise((resolve, reject) => {
                user.getUserAttributes((err, attributes) => {
                    if (err) reject(err);
                    else resolve(attributes || []);
                });
            });

            // Convert attributes to a more usable format
            const userAttributes: Record<string, string> = {};
            attributes.forEach((attr: any) => {
                userAttributes[attr.getName()] = attr.getValue();
            });

            console.log('User attributes loaded:', userAttributes);

            setAttributes(userAttributes);

            // Initialize form data with current values
            setFormData({
                givenName: userAttributes.given_name || '',
                familyName: userAttributes.family_name || '',
                address: userAttributes['custom:user_address'] || '',
                birthdate: userAttributes['custom:birthdate'] || '',
                phoneNumber: userAttributes['custom:user_phone'] || ''
            });

            setIsLoading(false);

        } catch (error) {
            console.error('Error refreshing user attributes:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // First check if we have a valid session
                const session = await getCurrentSession();
                if (session.isValid()) {
                    console.log('Valid session found, user authenticated');
                    // Then load the user attributes
                    await refreshUserAttributes();
                } else {
                    console.log('Invalid session found');
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Added useEffect to log when isSSOUser changes
    useEffect(() => {
        console.log('Rendering MainPage, isEditing:', isEditing);
        if (isSSOUser) {
            console.log('SSO user detected - edit button should be disabled');
        }
    }, [isEditing, isSSOUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Modify the handleSave function to use API for SSO users
    const handleSave = () => {
        setIsSaving(true);
        setEditMessage(null);

        if (isSSOUser) {
            console.log('SSO user detected, using API update method directly');
            // Code for API update will go here

            // For now, just show an error
            setEditMessage({
                type: 'error',
                text: 'Profile updates for SSO users are not yet available. We\'re working on it!'
            });
            setIsSaving(false);
            setIsEditing(false);
            return;
        }

        // Existing code for regular Cognito users...
        const user = UserPool.getCurrentUser();
        if (!user) {
            setEditMessage({
                type: 'error',
                text: 'Error: User not found. Please try logging in again.'
            });
            setIsSaving(false);
            return;
        }

        user.getSession((err: Error | null) => {
            if (err) {
                setEditMessage({
                    type: 'error',
                    text: 'Session error. Please try logging in again.'
                });
                setIsSaving(false);
                return;
            }

            // Combine given name and family name for the full name attribute
            const fullName = `${formData.givenName} ${formData.familyName}`.trim();

            // Create attribute list for update
            const attributeList = [
                new CognitoUserAttribute({ Name: 'name', Value: fullName }),
                new CognitoUserAttribute({ Name: 'given_name', Value: formData.givenName }),
                new CognitoUserAttribute({ Name: 'family_name', Value: formData.familyName }),
                new CognitoUserAttribute({ Name: 'custom:user_address', Value: formData.address }),
                new CognitoUserAttribute({ Name: 'custom:birthdate', Value: formData.birthdate }),
                new CognitoUserAttribute({ Name: 'custom:user_phone', Value: formData.phoneNumber })
            ];

            user.updateAttributes(attributeList, (updateErr) => {
                if (updateErr) {
                    console.error('Error updating attributes:', updateErr);

                    if (updateErr.message && updateErr.message.includes('scopes')) {
                        setEditMessage({
                            type: 'error',
                            text: 'Authentication error: Your account type does not have permission to update attributes. Please contact support.'
                        });
                    } else {
                        setEditMessage({
                            type: 'error',
                            text: `Failed to update profile: ${updateErr.message}`
                        });
                    }
                    setIsSaving(false);
                    return;
                }

                // After successful update, refresh the attributes from Cognito
                refreshUserAttributes();

                setEditMessage({
                    type: 'success',
                    text: 'Profile updated successfully!'
                });
                setIsEditing(false);
                setIsSaving(false);
            });
        });
    };

    const handleCancel = () => {
        // Reset form data to current values from Cognito attributes
        setFormData({
            givenName: cognitoAttributes.given_name || '',
            familyName: cognitoAttributes.family_name || '',
            address: cognitoAttributes['custom:user_address'] || '',
            birthdate: cognitoAttributes['custom:birthdate'] || '',
            phoneNumber: cognitoAttributes['custom:user_phone'] || ''
        });
        setIsEditing(false);
        setEditMessage(null);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="row">
                <div className="col-md-12">
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5>Student Information</h5>
                            {!isEditing ? (
                                <>
                                    {isSSOUser ? (
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            disabled
                                            title="Profile editing is not available for SSO users at this time"
                                        >
                                            Edit Unavailable
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <button
                                        className="btn btn-outline-secondary btn-sm me-2"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {editMessage && (
                                <div className={`alert alert-${editMessage.type === 'success' ? 'success' : 'danger'} mb-3`}>
                                    {editMessage.text}
                                </div>
                            )}

                            {/* This message will ALWAYS show for SSO users regardless of edit state */}
                            {isSSOUser && (
                                <div className="alert alert-warning mb-3">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    <strong>Google SSO Account</strong>
                                    <p className="mb-0">Student profile editing is not available for Google accounts.
                                        You can still use the AI Chatbot and other features of the platform.
                                        Profile editing for SSO users will be available in a future update.</p>
                                </div>
                            )}

                            {cognitoAttributes ? (
                                <div>
                                    {isEditing ? (
                                        // Edit mode with separate givenName and familyName fields
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label"><strong>First Name:</strong></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="givenName"
                                                    value={formData.givenName}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label"><strong>Last Name:</strong></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="familyName"
                                                    value={formData.familyName}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label"><strong>Email:</strong></label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={cognitoAttributes.email}
                                                    disabled
                                                />
                                                <small className="text-muted">Email cannot be changed</small>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label"><strong>Address:</strong></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label"><strong>Date of Birth:</strong></label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="birthdate"
                                                    value={formData.birthdate}
                                                    onChange={handleInputChange}
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label"><strong>Phone Number:</strong></label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    name="phoneNumber"
                                                    placeholder="+1234567890"
                                                    value={formData.phoneNumber}
                                                    onChange={handleInputChange}
                                                />
                                                <small className="text-muted">Use international format with + (e.g., +12125551234)</small>
                                            </div>
                                        </>
                                    ) : (
                                        // View mode - display directly from cognitoAttributes
                                        <>
                                            <p><strong>Name:</strong> {cognitoAttributes.name || `${cognitoAttributes.given_name || ''} ${cognitoAttributes.family_name || ''}`}</p>
                                            <p><strong>Email:</strong> {cognitoAttributes.email}</p>
                                            <p><strong>Address:</strong> {cognitoAttributes['custom:user_address'] || 'Not provided'}</p>

                                            {cognitoAttributes['custom:birthdate'] && (
                                                <p><strong>Date of Birth:</strong> {cognitoAttributes['custom:birthdate']}</p>
                                            )}
                                            {cognitoAttributes['custom:user_phone'] && (
                                                <p><strong>Phone Number:</strong> {cognitoAttributes['custom:user_phone']}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p>No user information available. Please sign in again.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Welcome message */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Welcome to Student Portal</h5>
                        </div>
                        <div className="card-body">
                            <p>This is your personalized dashboard. As we continue to develop this platform,
                                more features will be added to enhance your educational journey.</p>

                            <p>You can access your AI assistant by clicking on the "AI Chatbot" link in the navigation bar.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainPage;

