import React, { useState } from 'react';
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import '../assets/Main.css';
import email_icon from '../assets/email.png';
import password_icon from '../assets/password.png';
import user_icon from '../assets/user_icon.png';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
    // Necessary hooks to work with variables
    const [email, setEmail] = useState('');
    //const [firstName, setFirstName] = useState('');
    //const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState(''); // Confirmation code
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('Sign Up');
    const navigate = useNavigate(); // For file navigation in browser

    // Whole process of Signing Up
    const signUp = () => {
        // List of attributes required for cognito
        const attributeList = [
            new CognitoUserAttribute({ Name: 'email', Value: email }),
            new CognitoUserAttribute({ Name: 'name', Value: name }),
            new CognitoUserAttribute({ Name: 'username', Value: email })
        ];
        
        // signUp function from cognito
        UserPool.signUp(email, password, attributeList, [], (err, result) => {
            if (err) {
                console.error(err);
                alert(err.message);
            } else {
                console.log("Sign Up successful:", result);
                setStep(2);  // Only change steps if signup was successful
                setTitle('Confirm Sign Up');
            }
        });
    };

    const confirmSignUp = () => {
        // Creation of a user
        const user = new CognitoUser({ Username: email, Pool: UserPool });

        user.confirmRegistration(code, true, (err, result) => {
            if (err) {
                console.error(err);
                alert(err.message);
            } else {
                console.log('User confirmed:', result);
                alert('Registration successful! You can now log in.');
                setCode(''); 
                setPassword(''); 
                setEmail('');
                // Redirect to login on success
                navigate('/login');
            }
        });
    };

    // Rendering depending on which state we are at. Step 1 is Sign up, step 2 is confirmation code
    return (
        <div className='wrapper'>
            <div className="container">
                <div className="header">
                    <div className="text">{title}</div>
                    <div className="underline"></div>
                </div>
                <div className="inputs">
                    {step === 1 ? (
                        <>
                            <div className="input">
                                <img src={user_icon} alt="" />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                            </div>
                            <div className="input">
                                <img src={email_icon} alt="" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                            </div>
                            <div className="input">
                                <img src={password_icon} alt="" />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                            </div>
                            {/* Password requirements info */}
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
                                <div className="submit gray" onClick={() => navigate('/Login')}>Sign In</div>
                                <div className="submit" onClick={() => signUp()}>Sign Up</div>
                            </div>
                            <div className="forgot-password">
                                Already have a code? <span onClick={() => setStep(2)}>Enter confirmation code</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="input">
                                <img src={password_icon} alt="" />
                                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Verification code" />
                            </div>
                            <div className="submit-container">
                                <div className="submit" onClick={() => confirmSignUp()}>Confirm Sign Up</div>
                                <div className="submit gray" onClick={() => navigate('/Login')}>Back to Login</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Signup;