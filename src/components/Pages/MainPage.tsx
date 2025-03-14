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

    // Form state for editable fields - changed to have separate givenName and familyName
    const [formData, setFormData] = useState({
        givenName: '',
        familyName: '',
        address: '',
        birthdate: '',
        phoneNumber: ''
    });

    // Function to refresh user attributes from Cognito
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
                    setAttributes(userAttributes);

                    // Initialize form data with current values - now split into givenName and familyName
                    setFormData({
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

    const handleSave = () => {
        setIsSaving(true);
        setEditMessage(null);

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

