// import AWS from 'aws-sdk';
// import { NextResponse } from 'next/server';
// const bcrypt = require('bcryptjs');


// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
// });



// const s3 = new AWS.S3({
//     endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
//     accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
//     s3ForcePathStyle: true,
// });





// // Fetch a user by ID
// const getUserById = async (id) => {
//     const params = {
//         TableName: 'users',
//         Key: { id },  // Searching by user ID
//     };

//     try {
//         const result = await dynamoDb.get(params).promise();
//         return result.Item;  // Return the user item if found
//     } catch (error) {
//         console.log(error);
//         throw new Error('Error fetching user by ID');
//     }
// }

// // Fetch a user by email or phone (excluding a specific user)
// const getUserByEmailOrPhoneExcludingId = async (email, phone, userId) => {
//     const params = {
//         TableName: 'users',
//         FilterExpression: 'email = :email OR phone = :phone',
//         ExpressionAttributeValues: {
//             ':email': email,
//             ':phone': phone,
//         },
//     };

//     try {
//         const result = await dynamoDb.scan(params).promise();
//         const existingUsers = result.Items.filter(user => user.id !== userId); // Exclude the user with the provided ID
//         console.log('Existing users:', existingUsers);
//         return existingUsers;  // Return the matching items excluding the specified user ID
//     } catch (error) {
//         console.log(error);
//         throw new Error('Error checking for existing user');
//     }
// }

// // Handle GET request for fetching a user by ID
// export async function GET(req, { params }) {
//     const { id } = params; // Extract user ID from URL params

//     try {
//         const user = await getUserById(id);  // Fetch the user by ID
//         if (!user) {
//             return NextResponse.json({ error: 'User not found' }, { status: 404 });
//         }
//         return NextResponse.json(user, { status: 200 });  // Return user data
//     } catch (error) {
//         console.log(error);
//         return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });  // Error handling
//     }
// }

// export async function PUT(req, { params }) {
//     const { id } = await params; // Extract user ID from URL params

//     try {
//         // Get existing user data
//         const existingUser = await getUserById(id);
//         if (!existingUser) {
//             return NextResponse.json({ error: 'User not found' }, { status: 404 });
//         }

//         // Extract fields from request body
//         const { name, phone, email, password, role } = await req.json();

//         // Check for duplicate email or phone (if provided)
//         if (email || phone) {
//             const existingDuplicate = await getUserByEmailOrPhoneExcludingId(email || existingUser.email, phone || existingUser.phone, id);
//             if (existingDuplicate.length > 0) {
//                 return NextResponse.json({ error: 'Email or phone number must be unique' }, { status: 400 });
//             }
//         }

//         // Prepare updated user object (keep existing values if not provided)
//         const updatedUser = {
//             id,
//             name: name || existingUser.name,
//             phone: phone || existingUser.phone,
//             email: email || existingUser.email,
//             password: password ? bcrypt.hashSync(password, 10) : existingUser.password,
//             role: role || existingUser.role,
//         };

//         // Save to DynamoDB
//         const params = {
//             TableName: 'users',
//             Item: updatedUser,
//         };

//         await dynamoDb.put(params).promise();

//         return NextResponse.json(updatedUser, { status: 200 });

//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
//     }
// }

// export async function DELETE(req, { params }) {
//     const { id } = params;  // Extract user ID from URL params

//     try {
//         const user = await getUserById(id);  // Fetch the user by ID

//         if (!user) {
//             return NextResponse.json({ error: 'User not found' }, { status: 404 });
//         }

//         const params = {
//             TableName: 'users',
//             Key: { id },
//         };

//         // Delete the user from DynamoDB
//         await dynamoDb.delete(params).promise();

//         // Return a success message
//         return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

//     } catch (error) {
//         console.log(error);
//         return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });  // Error handling
//     }
// }



import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import AWS from 'aws-sdk';
import { S3BUCKETNAME } from '@/constants';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3({
    endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    sessionToken: process.env.NEXT_PUBLIC_S3_SESSION_TOKEN,
    s3ForcePathStyle: true,
});

// Fetch a user by ID
const getUserById = async (id) => {
    const params = {
        TableName: 'users',
        Key: { id }
    };

    try {
        const result = await dynamoDb.get(params).promise();
        return result.Item;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new Error('Failed to fetch user by ID');
    }
};

// Fetch a user by email or phone (excluding a specific user)
const getUserByEmailOrPhoneExcludingId = async (email, phone, userId) => {
    const params = {
        TableName: 'users',
        FilterExpression: '(email = :email OR phone = :phone) AND id <> :userId',
        ExpressionAttributeValues: {
            ':email': email,
            ':phone': phone,
            ':userId': userId
        }
    };

    try {
        const result = await dynamoDb.scan(params).promise();
        return result.Items;
    } catch (error) {
        console.error('Error checking for existing user:', error);
        throw new Error('Error checking for existing user');
    }
};

// Handle GET request for fetching a user by ID
export async function GET(req, { params }) {
    const { id } = params;

    try {
        const user = await getUserById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// Handle PUT request for updating user by ID
export async function PUT(req, { params }) {
    const { id } = params;

    try {
        // Get existing user data
        const existingUser = await getUserById(id);
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Extract fields from request body
        const { name, phone, email, password, role, imageUrl } = await req.json();

        // Check for duplicate email or phone (if provided)
        if (email || phone) {
            const existingDuplicate = await getUserByEmailOrPhoneExcludingId(
                email || existingUser.email,
                phone || existingUser.phone,
                id
            );
            if (existingDuplicate.length > 0) {
                return NextResponse.json({ error: 'Email or phone number must be unique' }, { status: 400 });
            }
        }

        // Prepare updated user object (keep existing values if not provided)
        const updatedUser = {
            id,
            name: name || existingUser.name,
            phone: phone || existingUser.phone,
            email: email || existingUser.email,
            password: password ? await bcrypt.hash(password, 10) : existingUser.password,
            role: role || existingUser.role,
            imageUrl: imageUrl || existingUser.imageUrl,
            updatedAt: new Date().toISOString()
        };

        // Save to DynamoDB
        const params = {
            TableName: 'users',
            Item: updatedUser
        };

        await dynamoDb.put(params).promise();

        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// Handle DELETE request for deleting user by ID
export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        const user = await getUserById(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const params = {
            TableName: 'users',
            Key: { id }
        };

        // Delete the user from DynamoDB
        await dynamoDb.delete(params).promise();

        // Return a success message
        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
