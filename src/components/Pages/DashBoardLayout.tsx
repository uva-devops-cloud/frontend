// src/components/Layout/DashboardLayout.tsx
import { useNavigate } from 'react-router-dom';
import { logOut } from '../../components/resources/AuthUtility';
import { Outlet } from 'react-router-dom';
import '../assets/Main.css'

const DashboardLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Use the comprehensive logout function
        logOut();

        // Redirect to login
        navigate('/login');
    };

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <a className="navbar-brand text2" href="#">Studee</a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <a className="nav-link" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" onClick={() => navigate('/LLM')} style={{ cursor: 'pointer' }}>AI Chatbot</a>
                            </li>
                            {/* Remove the Settings nav item */}
                        </ul>
                        <button className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container mt-4">
                {/* Chosen child will be rendered here*/}
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;