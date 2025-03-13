import { useEffect, useState } from 'react';
import { fetchStudent, Student } from '../API/Api';

const MainPage = () => {
    const [student, setStudent] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Get user info from localStorage (set during login)
                const storedUserInfo = localStorage.getItem('userInfo');
                if (storedUserInfo) {
                    setUserInfo(JSON.parse(storedUserInfo));
                }

                // Optional: Keep the student data fetch if needed
                const studentData = await fetchStudent();
                setStudent(studentData);
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
                            {userInfo ? (
                                <div>
                                    <p><strong>Email:</strong> {userInfo.email}</p>
                                    <p><strong>Name:</strong> {userInfo.name}</p>
                                    {/* Add other attributes here as needed */}
                                </div>
                            ) : (
                                student.length > 0 ? (
                                    <div>
                                        <p><strong>Name:</strong> {student[0].name}</p>
                                        <p><strong>Email:</strong> {student[0].email}</p>
                                        <p><strong>Address:</strong> {student[0].address}</p>
                                    </div>
                                ) : (
                                    <p>No student information available</p>
                                )
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