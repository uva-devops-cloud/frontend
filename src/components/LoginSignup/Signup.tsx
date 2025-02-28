import React, { useState } from 'react'
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';
import './LoginSignup.css'
import email_icon from '../assets/email.png'
import password_icon from '../assets/password.png'
import user_icon from '../assets/user_icon.png'
import { useNavigate } from 'react-router-dom';




const Signup: React.FC = () => {
    //Necessary hooks to work with variables
    const [email, setEmail] = useState('');
    const [firstName, setfirstName] = useState('');
    const [lastName, setlastName] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState(''); //confirmation code
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('Sign Up')
    const navigate = useNavigate();// for file navigation in browser

    //Whole process of Signing Up
    const signUp = () => {
        //List of attributes required for cognito
        const attributeList = [
            new CognitoUserAttribute({ Name: 'email', Value: email }),
            new CognitoUserAttribute({ Name: 'First Name', Value: firstName }),
            new CognitoUserAttribute({ Name: 'Last Name', Value: lastName })
        ];
        //signUp function from cognito
        UserPool.signUp(email, password, attributeList, [], (err, result) => {
            if (err) {
                console.error(err);
                alert(err.message)
            } else {
                console.log("Sign Up successful:", result);

            }
        });
        setfirstName(''); setPassword(''); setEmail(''); setlastName('');
    }

    const confirmSignUp = () => {
        //creation of a user
        const user = new CognitoUser({ Username: email, Pool: UserPool });

        user.confirmRegistration(code, true, (err, result) => {
            if (err) {
                console.error(err);
                alert(err.message);
            } else {
                console.log('User confirmed:', result);
                alert('Registration successful! You can now log in.');
            }
        })
        setCode('');
        navigate('/login');
    }

    //rendering depending on which state we are at. Step 1 is Sign up, step 2 is confirmation code
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
                                <input type="text" value={firstName} onChange={(e) => setfirstName(e.target.value)} placeholder="First Name" />
                            </div>
                            <div className="input">
                                <img src={user_icon} alt="" />
                                <input type="text" value={lastName} onChange={(e) => setlastName(e.target.value)} placeholder="Last Name" />
                            </div>
                            <div className="input">
                                <img src={email_icon} alt="" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                            </div>
                            <div className="input">
                                <img src={password_icon} alt="" />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                            </div>
                            <div className="submit-container">
                                <div className="submit" onClick={() => { signUp(); setStep(2); setTitle('Confirm Sign Up') }}>Sign Up</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="input">
                                <img src={password_icon} alt="" />
                                <input type="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Name" />
                            </div>
                            <div className="submit-container">
                                <div className="submit" onClick={() => { confirmSignUp(); setStep(1); setTitle('Sign Up') }}>Sign Up</div>
                            </div>
                        </>)}
                </div>

            </div>
        </div>
    )
}

export default Signup