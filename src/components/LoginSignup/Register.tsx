import { useState } from 'react';
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import UserPool from '../resources/Cognito';

const Register: React.FC = () => { //React.FC describes a function component
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState(1); // Step 1: Registration, Step 2: Confirmation

    const signUp = () => {
        const attributeList = [
            new CognitoUserAttribute({ Name: 'email', Value: email }),
            new CognitoUserAttribute({ Name: 'name', Value: 'TestName' })
        ];

        UserPool.signUp(email, password, attributeList, [], (err, result) => {
            if (err) {
                console.error(err);
                alert(err.message);
            } else {
                console.log('Sign-up successful:', result);
                setStep(2); // Move to confirmation step
            }
        });
    };

    const confirmSignUp = () => {
        const user = new CognitoUser({ Username: email, Pool: UserPool });

        user.confirmRegistration(code, true, (err, result) => {
            if (err) {
                console.error(err);
                alert(err.message);
            } else {
                console.log('User confirmed:', result);
                alert('Registration successful! You can now log in.');
            }
        });
    };

    return (
        <div>
            {step === 1 ? (
                <>
                    <h2>Register</h2>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                    <button onClick={signUp}>Sign Up</button>
                </>
            ) : (
                <>
                    <h2>Confirm Registration</h2>
                    <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Confirmation Code" />
                    <button onClick={confirmSignUp}>Confirm</button>
                </>
            )}
        </div>
    );
};

export default Register;
