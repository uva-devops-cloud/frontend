import React, { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import '../assets/Main.css';
import email_icon from '../assets/email.png';
import password_icon from '../assets/password.png';
import { useNavigate } from 'react-router-dom';

const PasswordReset: React.FC = () => {
    const [email, setEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [step, setStep] = useState(1); // 1: enter email, 2: enter code & new password
    const navigate = useNavigate();

    const requestResetCode = () => {
        if (!email) {
            setMessage('Please enter your email address');
            return;
        }

        const user = new CognitoUser({
            Username: email,
            Pool: UserPool,
        });

        user.forgotPassword({
            onSuccess: () => {
                setMessage('Reset code has been sent to your email');
                setStep(2);
            },
            onFailure: (err) => {
                console.error('Reset password failed:', err);
                setMessage(err.message || 'Failed to send reset code');
            }
        });
    };

    const confirmPasswordReset = () => {
        if (!resetCode || !newPassword) {
            setMessage('Please enter both verification code and new password');
            return;
        }

        const user = new CognitoUser({
            Username: email,
            Pool: UserPool,
        });

        user.confirmPassword(resetCode, newPassword, {
            onSuccess: () => {
                setMessage('Password has been reset successfully');
                // Return to login after a brief delay
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            },
            onFailure: (err) => {
                console.error('Confirm password failed:', err);
                setMessage(err.message || 'Failed to reset password');
            }
        });
    };

    return (
        <div className="wrapper">
            <div className="container">
                <div className="header">
                    <div className="text">{step === 1 ? 'Reset Password' : 'Enter Code'}</div>
                    <div className="underline"></div>
                </div>
                <div className="inputs">
                    {step === 1 ? (
                        <>
                            <div className="input">
                                <img src={email_icon} alt="" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                />
                            </div>
                            {message && <div className="reset-message">{message}</div>}
                            <div className="submit-container">
                                <div className="submit gray" onClick={() => navigate('/login')}>Back to Login</div>
                                <div className="submit" onClick={requestResetCode}>Send Code</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="input">
                                <img src={password_icon} alt="" />
                                <input
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    placeholder="Verification Code"
                                />
                            </div>
                            <div className="input">
                                <img src={password_icon} alt="" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                />
                            </div>
                            {message && <div className="reset-message">{message}</div>}
                            <div className="password-requirements">
                                <small>
                                    Password must contain:
                                    <ul>
                                        <li>Minimum 8 characters</li>
                                        <li>At least one number</li>
                                        <li>At least one uppercase letter</li>
                                        <li>At least one lowercase letter</li>
                                    </ul>
                                </small>
                            </div>
                            <div className="submit-container">
                                <div className="submit gray" onClick={() => setStep(1)}>Back</div>
                                <div className="submit" onClick={confirmPasswordReset}>Reset Password</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordReset;