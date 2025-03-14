import { useEffect, useState } from 'react';
// import { fetchStudent, Student } from '../API/Api'; // Commented out API import
import { getCurrentSession } from '../resources/AuthUtility';
import UserPool from '../resources/Cognito';

const MainPage = () => {
    // const [student, setStudent] = useState<Student | null>(null); // Commented out API-related state
    const [cognitoAttributes, setAttributes] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // First, always try to get data from backend as source of truth
                // const studentData = await fetchStudent();
                // if (studentData && studentData.length > 0) {
                //     setStudent(studentData[0]);
                // }

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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="row">
                <div className="col-md-12">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5>Student Information</h5>
                        </div>
                        <div className="card-body">
                            {cognitoAttributes ? (
                                <div>
                                    <p><strong>Name:</strong> {cognitoAttributes.name || `${cognitoAttributes.given_name || ''} ${cognitoAttributes.family_name || ''}`}</p>
                                    <p><strong>Email:</strong> {cognitoAttributes.email}</p>
                                    <p><strong>Address:</strong> {cognitoAttributes['custom:user_address'] || 'Not provided'}</p>

                                    {/* Display additional attributes from Cognito if available */}
                                    {cognitoAttributes['custom:birthdate'] && (
                                        <p><strong>Date of Birth:</strong> {cognitoAttributes['custom:birthdate']}</p>
                                    )}
                                    {cognitoAttributes['custom:user_phone'] && typeof cognitoAttributes['custom:user_phone'] === 'string' && (
                                        <p><strong>Phone Number:</strong> {cognitoAttributes['custom:user_phone']}</p>
                                    )}
                                </div>
                            ) : (
                                // Try to use localStorage fallback if Cognito attributes aren't available
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

