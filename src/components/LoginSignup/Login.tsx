import React, { useState, useEffect, useRef } from 'react'
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import '../assets/Main.css'
import email_icon from '../assets/email.png'
import password_icon from '../assets/password.png'
import google_icon from '../assets/google_icon.png'
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthToken } from '../../components/resources/AuthUtility';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const processedCodes = useRef(new Set());

    // Add this helper function at the top of your component
    const clearPreviousLoginData = () => {
        // Clear all auth tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('extendedUserInfo');

        // Clean up Cognito-specific localStorage items
        const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
        if (clientId) {
            const keyPrefix = `CognitoIdentityServiceProvider.${clientId}`;

            // Remove any items that match the Cognito pattern
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(keyPrefix)) {
                    localStorage.removeItem(key);
                }
            }
        }
    };

    // Exchange authorization code for tokens
    const exchangeCodeForTokens = async (code: string): Promise<any> => {
        try {
            const domainPrefix = import.meta.env.VITE_COGNITO_DOMAIN;
            const cognitoDomain = `${domainPrefix}.auth.eu-west-2.amazoncognito.com`;
            const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
            const redirectUri = window.location.origin + '/login';

            console.log('Token exchange details:', {
                cognitoDomain,
                clientId,
                redirectUri,
                codeLength: code?.length || 0
            });

            // Add timestamp to prevent caching issues
            const tokenRequest = new URLSearchParams();
            tokenRequest.append('grant_type', 'authorization_code');
            tokenRequest.append('client_id', clientId);
            tokenRequest.append('code', code);
            tokenRequest.append('redirect_uri', redirectUri);

            // Add cache busting and improved error handling
            const response = await fetch(`https://${cognitoDomain}/oauth2/token?_=${Date.now()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache'
                },
                body: tokenRequest
            });

            const responseText = await response.text();
            console.log('Raw token response:', responseText);

            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || response.statusText}`);
                } catch (parseError) {
                    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
                }
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Error exchanging code for tokens:', error);
            throw error;
        }
    };

    // Extract user profile information from ID token
    const parseJwt = (token: string): any => {
        try {
            // Split the token and get the payload part
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // Decode the base64 string
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT token:', error);
            return null;
        }
    };

    // Handle OAuth callback
    useEffect(() => {
        const handleOAuthCallback = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');
            const idToken = params.get('id_token');

            if (!code && !idToken) return;

            // Check if we've already processed this code
            if (code && processedCodes.current.has(code)) {
                console.log('Auth code already processed, skipping');
                return;
            }

            setIsProcessingOAuth(true);

            try {
                if (code) {
                    // Mark this code as processed immediately
                    processedCodes.current.add(code);

                    console.log('OAuth code received, exchanging for tokens...');
                    const tokenData = await exchangeCodeForTokens(code);

                    // Clear any previous login data before setting new data
                    clearPreviousLoginData();

                    // Store tokens
                    localStorage.setItem('accessToken', tokenData.access_token);
                    localStorage.setItem('refreshToken', tokenData.refresh_token);
                    localStorage.setItem('idToken', tokenData.id_token);
                    localStorage.setItem('tokenSource', 'google');
                    localStorage.setItem('tokenTimestamp', Date.now().toString());
                    setAuthToken(tokenData.access_token);

                    // Extract user information from ID token
                    const userInfo = parseJwt(tokenData.id_token);
                    console.log('User authenticated:', userInfo.email);

                    // Store basic user info
                    localStorage.setItem('userInfo', JSON.stringify({
                        email: userInfo.email,
                        name: userInfo.name || userInfo.email,
                        sub: userInfo.sub
                    }));

                    // Remove the code from URL
                    window.history.replaceState({}, document.title, '/login');

                    // We need to manually set up the Cognito user from tokens for SSO
                    const idTokenPayload = parseJwt(tokenData.id_token);

                    // Store tokens in the exact format Cognito SDK expects
                    const keyPrefix = `CognitoIdentityServiceProvider.${import.meta.env.VITE_COGNITO_CLIENT_ID}`;
                    const userKey = `${keyPrefix}.${idTokenPayload.email}`;

                    localStorage.setItem(`${userKey}.idToken`, tokenData.id_token);
                    localStorage.setItem(`${userKey}.accessToken`, tokenData.access_token);
                    localStorage.setItem(`${userKey}.refreshToken`, tokenData.refresh_token);
                    localStorage.setItem(`${keyPrefix}.LastAuthUser`, idTokenPayload.email);

                    // Simply navigate to dashboard without profile check
                    navigate('/dashboard');

                    return;
                }

                // Implicit flow handling
                else if (idToken) {
                    // Handle implicit flow logic...
                    // ...

                    // After handling implicit flow, direct to dashboard
                    navigate('/dashboard');
                }
            } catch (error) {
                // Error handling...
                console.error('OAuth authentication failed:', error);
                alert('Authentication failed. Please try again.');
            } finally {
                setIsProcessingOAuth(false);
            }
        };

        handleOAuthCallback();
    }, [location, navigate]);

    const signIn = (email: string, password: string) => {
        // Clear any previous SSO indicators
        localStorage.removeItem('tokenSource');

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
                // Navigate immediately after successful login
                navigate('/dashboard');
            },
            onFailure: (err) => {
                console.error('Login failed:', err);
                alert(err.message || 'Login failed');
            },
        });

        setEmail('');
        setPassword('');
    }

    const handleGoogleSignIn = () => {
        console.log('Using Cognito domain:', import.meta.env.VITE_COGNITO_DOMAIN); // Debug output

        // Get just the domain prefix from env variables
        const domainPrefix = import.meta.env.VITE_COGNITO_DOMAIN;
        // Form the complete Cognito domain URL
        const cognitoDomain = `${domainPrefix}.auth.eu-west-2.amazoncognito.com`;
        const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
        const redirectUri = window.location.origin + '/login';

        // Build the authorization URL with Google as the identity provider
        const authorizationUrl = `https://${cognitoDomain}/oauth2/authorize?` +
            `identity_provider=Google` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&client_id=${clientId}` +
            `&scope=${encodeURIComponent('openid email profile')}`;

        console.log('Redirecting to:', authorizationUrl); // Debug the full URL
        window.location.href = authorizationUrl;
    };

    // Show loading indicator while processing OAuth
    if (isProcessingOAuth) {
        return (
            <div className="wrapper">
                <div className="container">
                    <div className="header">
                        <div className="text">Signing in...</div>
                        <div className="underline"></div>
                    </div>
                    <div className="inputs" style={{ textAlign: 'center', marginTop: '30px' }}>
                        <p>Please wait while we complete your authentication</p>
                        {/* You could add a spinner here */}
                    </div>
                </div>
            </div>
        );
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

                    {/* Google SSO Button */}
                    <div className="social-login">
                        <div className="social-btn" onClick={handleGoogleSignIn}>
                            <img src={google_icon} alt="Google" />
                            <span>Sign in with Google</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login