import React, { useState } from 'react'
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import './LoginSignup.css'
import email_icon from '../assets/email.png'
import password_icon from '../assets/password.png'
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../components/resources/AuthUtility'; // Import the new utility

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const signIn = (email: string, password: string) => {
        const user = new CognitoUser({
            Username: email,
            Pool: UserPool,
        });

        const authDetails = new AuthenticationDetails({
            Username: email,
            Password: password,
        });

        user.authenticateUser(authDetails, {
            onSuccess: (result) => {
                console.log('Login successful!', result);
                //alert('Login successful!');
                const accessToken = result.getAccessToken().getJwtToken();
                // Store token using utility
                setAuthToken(accessToken);
                navigate('/dashboard');
            },
            onFailure: (err) => {
                console.error('Login failed:', err);
                alert(err.message || 'Login failed');
            },
        });
        setEmail(''); setPassword('');
    }

    return (
        <div className="wrapper">
            <div className="container">
                <div className="header">
                    <div className="text">Sign In</div>
                    <div className="underline"></div>
                </div>
                <div className="inputs">
                    <div className="input">
                        <img src={email_icon} alt="" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    </div>
                    <div className="input">
                        <img src={password_icon} alt="" />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                    </div>
                    <div className="submit-container">
                        <div className="submit" onClick={() => { signIn(email, password) }}>Sign In</div>
                        <div className="submit gray" onClick={() => navigate('/SignUp')}>Sign Up</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login