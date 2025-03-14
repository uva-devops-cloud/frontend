import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import UserPool from './Cognito';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const user = UserPool.getCurrentUser();

            if (!user) {
                console.log("No user found in Cognito");
                setIsAuthenticated(false);
                return;
            }

            try {
                user.getSession((err: Error | null, session: any) => {
                    if (err) {
                        console.error("Session error:", err);
                        setIsAuthenticated(false);
                        return;
                    }

                    if (session && session.isValid()) {
                        console.log("Valid session found, user authenticated");
                        setIsAuthenticated(true);
                    } else {
                        console.log("Invalid session");
                        setIsAuthenticated(false);
                    }
                });
            } catch (error) {
                console.error('Authentication check failed:', error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    // Show loading while checking authentication
    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

export default ProtectedRoute;