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

    // Form state for editable fields
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        birthdate: '',
        phoneNumber: ''
    });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Get attributes from Cognito
                try {
                    const session = await getCurrentSession();
                    if (session.isValid()) {
                        const user = UserPool.getCurrentUser();
                        if (user) {
                            user.getSession((err: Error | null) => {
                                if (!err) {
                                    user.getUserAttributes((err, attributes) => {
                                        if (!err && attributes) {
                                            const userAttributes: Record<string, string> = {};
                                            attributes.forEach(attr => {
                                                userAttributes[attr.getName()] = attr.getValue();
                                            });
                                            setAttributes(userAttributes);

                                            // Initialize form data with current values
                                            setFormData({
                                                name: userAttributes.name || `${userAttributes.given_name || ''} ${userAttributes.family_name || ''}`,
                                                address: userAttributes['custom:user_address'] || '',
                                                birthdate: userAttributes['custom:birthdate'] || '',
                                                phoneNumber: userAttributes['custom:user_phone'] || ''
                                            });
                                        }
                                    });
                                }
                            });
                        }
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

            // Split name into given_name and family_name if possible
            let givenName = '';
            let familyName = '';

            // Attempt to split the name by the last space
            const nameParts = formData.name.trim().split(/\s+/);
            if (nameParts.length > 1) {
                givenName = nameParts.slice(0, -1).join(' ');
                familyName = nameParts[nameParts.length - 1];
            } else {
                // If there's only one part, use it as given_name
                givenName = formData.name;
            }

            // Create attribute list for update
            const attributeList = [
                new CognitoUserAttribute({ Name: 'name', Value: formData.name }),
                new CognitoUserAttribute({ Name: 'given_name', Value: givenName }),
                new CognitoUserAttribute({ Name: 'family_name', Value: familyName }),
                new CognitoUserAttribute({ Name: 'custom:user_address', Value: formData.address }),
                new CognitoUserAttribute({ Name: 'custom:birthdate', Value: formData.birthdate }),
                new CognitoUserAttribute({ Name: 'custom:user_phone', Value: formData.phoneNumber })
            ];

            user.updateAttributes(attributeList, (updateErr) => {
                if (updateErr) {
                    console.error('Error updating attributes:', updateErr);
                    setEditMessage({
                        type: 'error',
                        text: `Failed to update profile: ${updateErr.message}`
                    });
                    setIsSaving(false);
                    return;
                }

                // If successful, update state
                const updatedAttributes = { ...cognitoAttributes };
                updatedAttributes.name = formData.name;
                updatedAttributes.given_name = givenName;
                updatedAttributes.family_name = familyName;
                updatedAttributes['custom:user_address'] = formData.address;
                updatedAttributes['custom:birthdate'] = formData.birthdate;
                updatedAttributes['custom:user_phone'] = formData.phoneNumber;

                setAttributes(updatedAttributes);
                setEditMessage({
                    type: 'success',
                    text: 'Profile updated successfully!'
                });
                setIsEditing(false);
                setIsSaving(false);

                // Store in localStorage as fallback
                const localStorageData = {
                    name: formData.name,
                    givenName,
                    familyName,
                    email: cognitoAttributes.email,
                    address: formData.address,
                    birthdate: formData.birthdate,
                    phoneNumber: formData.phoneNumber
                };

                localStorage.setItem('extendedUserInfo', JSON.stringify(localStorageData));
            });
        });
    };

    const handleCancel = () => {
        // Reset form data to current values
        setFormData({
            name: cognitoAttributes.name || `${cognitoAttributes.given_name || ''} ${cognitoAttributes.family_name || ''}`,
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
                                        // Edit mode
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label"><strong>Name:</strong></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="name"
                                                    value={formData.name}
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
                                        // View mode
                                        <>
                                            <p><strong>Name:</strong> {cognitoAttributes.name || `${cognitoAttributes.given_name || ''} ${cognitoAttributes.family_name || ''}`}</p>
                                            <p><strong>Email:</strong> {cognitoAttributes.email}</p>
                                            <p><strong>Address:</strong> {cognitoAttributes['custom:user_address'] || 'Not provided'}</p>

                                            {cognitoAttributes['custom:birthdate'] && (
                                                <p><strong>Date of Birth:</strong> {cognitoAttributes['custom:birthdate']}</p>
                                            )}
                                            {cognitoAttributes['custom:user_phone'] && typeof cognitoAttributes['custom:user_phone'] === 'string' && (
                                                <p><strong>Phone Number:</strong> {cognitoAttributes['custom:user_phone']}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                // Fallback to localStorage if Cognito attributes aren't available
                                (() => {
                                    const fallbackUserData = localStorage.getItem('extendedUserInfo');
                                    if (fallbackUserData) {
                                        try {
                                            const userData = JSON.parse(fallbackUserData);
                                            return (
                                                <div>
                                                    <p><strong>Name:</strong> {userData.name || `${userData.givenName || ''} ${userData.familyName || ''}`}</p>
                                                    <p><strong>Email:</strong> {userData.email}</p>
                                                    <p><strong>Address:</strong> {userData.address || 'Not provided'}</p>
                                                    {userData.birthdate && <p><strong>Date of Birth:</strong> {userData.birthdate}</p>}
                                                    {userData.phoneNumber && <p><strong>Phone Number:</strong> {userData.phoneNumber}</p>}
                                                </div>
                                            );
                                        } catch (e) {
                                            return <p>No student information available.</p>;
                                        }
                                    }
                                    return <p>No student information available.</p>;
                                })()
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

