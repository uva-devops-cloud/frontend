import React, { useState } from 'react'
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import './LoginSignup.css'
import email_icon from '../assets/email.png'
import password_icon from '../assets/password.png'



const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState<string | null>(null);


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
                alert('Login successful!');

                const accessToken = result.getAccessToken().getJwtToken(); // get the token from cognito
                setToken(accessToken);

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
                    <div className="text">Login</div>
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
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login