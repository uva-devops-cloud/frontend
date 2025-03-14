import { useEffect, useState } from 'react';
import { getCurrentSession } from '../resources/AuthUtility';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import { updateUserProfile } from '../API/ProfileAPI';

const MainPage = () => {
    // Existing state variables remain the same
    const [cognitoAttributes, setAttributes] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSsoUser, setIsSsoUser] = useState(false);

    // Form state remains the same
    const [formData, setFormData] = useState({
        givenName: '',
        familyName: '',
        address: '',
        birthdate: '',
        phoneNumber: ''
    });

    // Function to detect if user is logged in with SSO
    const detectSsoUser = (attributes: any) => {
        console.log("Running SSO detection with attributes:", attributes);

        // First check for identities (most reliable method)
        if (attributes.identities) {
            try {
                console.log("Raw identities:", attributes.identities);
                const identities = JSON.parse(attributes.identities);
                if (identities && identities.length > 0 &&
                    (identities[0].providerType === 'Google' ||
                        identities[0].providerName === 'Google')) {
                    console.log('User authenticated via Google SSO (from identities)');

                    // If this is definitely an SSO user, make sure localStorage is consistent
                    localStorage.setItem('tokenSource', 'google');
                    return true;
                }
            } catch (e) {
                console.error('Error parsing identities:', e);
            }
        }

        // If no identities but tokenSource exists, check if it's from a recent login
        // This handles the case where attributes haven't been fully loaded yet
        const tokenSource = localStorage.getItem('tokenSource');
        if (tokenSource === 'google') {
            const timestamp = localStorage.getItem('tokenTimestamp');
            const currentTime = new Date().getTime();

            // Only trust localStorage tokenSource if it's recent (1 hour)
            if (timestamp && (currentTime - parseInt(timestamp)) < 3600000) {
                console.log('User authenticated via Google SSO (from recent localStorage)');
                return true;
            } else {
                // Clear outdated tokenSource
                localStorage.removeItem('tokenSource');
            }
        }

        console.log('User is not detected as SSO user');
        return false;
    };

    // Function to refresh user attributes - updated to detect SSO
    const refreshUserAttributes = () => {
        const user = UserPool.getCurrentUser();
        if (!user) return;

        user.getSession((err: Error | null) => {
            if (err) return;

            user.getUserAttributes((attrErr, attributes) => {
                if (!attrErr && attributes) {
                    const userAttributes: Record<string, string> = {};
                    attributes.forEach(attr => {
                        userAttributes[attr.getName()] = attr.getValue();
                    });

                    console.log("All user attributes:", userAttributes); // Add this line

                    // Check sub attribute specifically
                    console.log("Sub attribute:", userAttributes.sub);

                    // Check identities attribute
                    if (userAttributes.identities) {
                        console.log("Identities attribute:", userAttributes.identities);
                        try {
                            const identities = JSON.parse(userAttributes.identities);
                            console.log("Parsed identities:", identities);
                        } catch (e) {
                            console.error("Failed to parse identities:", e);
                        }
                    } else {
                        console.log("No identities attribute found");
                    }

                    // Detect if the user logged in via SSO
                    const ssoUser = detectSsoUser(userAttributes);
                    console.log("Is SSO user detected:", ssoUser);
                    setIsSsoUser(ssoUser);

                    setAttributes(userAttributes);

                    // Initialize form data with current values
                    setFormData({
                        givenName: userAttributes.given_name || '',
                        familyName: userAttributes.family_name || '',
                        address: userAttributes['custom:user_address'] || '',
                        birthdate: userAttributes['custom:birthdate'] || '',
                        phoneNumber: userAttributes['custom:user_phone'] || ''
                    });

                    console.log("Form data being initialized with:", {
                        givenName: userAttributes.given_name || '',
                        familyName: userAttributes.family_name || '',
                        address: userAttributes['custom:user_address'] || '',
                        birthdate: userAttributes['custom:birthdate'] || '',
                        phoneNumber: userAttributes['custom:user_phone'] || ''
                    });
                }
            });
        });
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                try {
                    const session = await getCurrentSession();
                    if (session.isValid()) {
                        refreshUserAttributes();
                    }
                } catch (error) {
                    console.error('Error fetching Cognito attributes:', error);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Updated handleSave function to use the API for SSO users
    const handleSave = async () => {
        setIsSaving(true);
        setEditMessage(null);

        // Force-check localStorage for SSO status before proceeding
        // This ensures the most current SSO state
        const tokenSource = localStorage.getItem('tokenSource');
        const forceIsSsoUser = tokenSource === 'google';

        console.log("Before save - localStorage tokenSource:", tokenSource);
        console.log("Before save - forceIsSsoUser:", forceIsSsoUser);
        console.log("Before save - isSsoUser state:", isSsoUser);

        // Use the forced check OR the state value
        const isCurrentUserSso = forceIsSsoUser || isSsoUser;

        const user = UserPool.getCurrentUser();
        if (!user) {
            setEditMessage({
                type: 'error',
                text: 'Error: User not found. Please try logging in again.'
            });
            setIsSaving(false);
            return;
        }

        try {
            // Combine given name and family name for the full name attribute
            const fullName = `${formData.givenName} ${formData.familyName}`.trim();

            // Create attribute list for update
            const attributeList = [
                { Name: 'name', Value: fullName },
                { Name: 'given_name', Value: formData.givenName },
                { Name: 'family_name', Value: formData.familyName },
                { Name: 'custom:user_address', Value: formData.address },
                { Name: 'custom:birthdate', Value: formData.birthdate },
                { Name: 'custom:user_phone', Value: formData.phoneNumber }
            ];

            if (isCurrentUserSso) {
                console.log('Detected as SSO user, using API');
                // For SSO users, use the API endpoint
                await updateUserProfile(attributeList);
                refreshUserAttributes();

                setEditMessage({
                    type: 'success',
                    text: 'Profile updated successfully!'
                });
            } else {
                console.log('Detected as regular user, using Cognito SDK');
                // For regular users, use the direct Cognito update
                console.log('Updating regular user profile via Cognito SDK');
                await new Promise<void>((resolve, reject) => {
                    user.getSession((sessionErr: Error | null) => {
                        if (sessionErr) {
                            reject(sessionErr);
                            return;
                        }

                        const cognitoAttributeList = attributeList.map(attr =>
                            new CognitoUserAttribute({ Name: attr.Name, Value: attr.Value })
                        );

                        user.updateAttributes(cognitoAttributeList, (updateErr) => {
                            if (updateErr) {
                                reject(updateErr);
                            } else {
                                resolve();
                            }
                        });
                    });
                });

                refreshUserAttributes();

                setEditMessage({
                    type: 'success',
                    text: 'Profile updated successfully!'
                });
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setEditMessage({
                type: 'error',
                text: error.message || 'Failed to update profile'
            });
        } finally {
            setIsEditing(false);
            setIsSaving(false);
        }
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
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit
                                </button>
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

