import React, { useState } from 'react';
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import '../assets/Main.css';
import email_icon from '../assets/email.png';
import password_icon from '../assets/password.png';
import user_icon from '../assets/user_icon.png';
import calendar_icon from '../assets/icons8-calendar-50.png'; // Add this icon
import phone_icon from '../assets/icons8-call-50.png'; // Add this icon
import address_icon from '../assets/icons8-house-50.png'; // Add this icon
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [givenName, setGivenName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [code, setCode] = useState(''); // Confirmation code
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('Sign Up');
    const navigate = useNavigate();

    // Whole process of Signing Up
    const signUp = () => {
        // Add validation before signup
        if (!phoneNumber.startsWith('+')) {
            alert('Phone number must be in international format starting with + (e.g., +12125551234)');
            return;
        }

        // List of attributes required for cognito
        const formattedBirthdate = birthdate; // Already in YYYY-MM-DD format from date input
        const attributeList = [
            new CognitoUserAttribute({ Name: 'email', Value: email }),
            new CognitoUserAttribute({ Name: 'given_name', Value: givenName }),
            new CognitoUserAttribute({ Name: 'family_name', Value: familyName }),
            new CognitoUserAttribute({ Name: 'name', Value: `${givenName} ${familyName}` }), // Keep name for backward compatibility
            new CognitoUserAttribute({ Name: 'custom:birthdate', Value: formattedBirthdate }),
            new CognitoUserAttribute({ Name: 'custom:user_phone', Value: phoneNumber }),  // Updated
            new CognitoUserAttribute({ Name: 'custom:user_address', Value: address })     // Updated
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
                                <input type="text" value={givenName} onChange={(e) => setGivenName(e.target.value)} placeholder="First Name" />
                            </div>
                            <div className="input">
                                <img src={user_icon} alt="" />
                                <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Last Name" />
                            </div>
                            <div className="input">
                                <img src={email_icon} alt="" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                            </div>
                            <div className="input">
                                <img src={calendar_icon} alt="" />
                                <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} placeholder="Date of Birth" />
                            </div>
                            <div className="input">
                                <img src={phone_icon} alt="" />
                                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone Number" />
                            </div>
                            <div className="input">
                                <img src={address_icon} alt="" />
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
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