import React from 'react'
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: 'eu-west-2_zuTcnuVPt',
    ClientId: '5il45b75vsl79a9gst7soeu0tu',
};

export default new CognitoUserPool(poolData);