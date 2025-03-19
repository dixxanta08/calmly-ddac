
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();


console.log("AWS_REGION", process.env.NEXT_PUBLIC_AWS_REGION);
console.log("DYNAMODB_ENDPOINT", process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT);
console.log("DYNAMODB_ACCESS_KEY_ID", process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID);
console.log("DYNAMODB_SECRET_ACCESS_KEY", process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY);
console.log("access key", process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID);
console.log("secret key", process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY);

// Configure AWS SDK with your region and credentials
AWS.config.update({
    region: process.env.NEXT_PUBLIC_AWS_REGION,  // Replace with your region
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,  // Or replace with your access key
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,  // Or replace with your secret key
});



// Initialize Cognito Identity Service
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// Define the parameters for creating the User Pool
const params = {
    PoolName: "dixxanta-local-pool",
    AliasAttributes: ['email',],
    AutoVerifiedAttributes: ['email'],
    MfaConfiguration: 'OFF',
    Policies: {
        PasswordPolicy: {
            MinimumLength: 8,
            RequireUppercase: true,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
        },
    },
    Schema: [
        {
            Name: 'email',  // Attribute name
            AttributeDataType: 'String',
            Required: true,  // Email is required
            Mutable: false,  // Email cannot be changed after registration
        },
        {
            Name: 'phone_number',
            AttributeDataType: 'String',
            Required: false,  // Phone number is optional
            Mutable: true,
        },
        {
            Name: 'name',
            AttributeDataType: 'String',
            Required: false,
            Mutable: true,
        },
    ],
    VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_LINK',  // Verification method for email
    },
};

// Function to create the Cognito User Pool
async function createUserPool() {
    try {
        const data = await cognitoIdentityServiceProvider.createUserPool(params).promise();
        console.log('User Pool Created:', data);
        console.log('User Pool ID:', data.UserPool.Id);  // Output User Pool ID
    } catch (err) {
        console.error('Error creating User Pool:', err);
    }
}

// Run the function to create the pool
createUserPool();
