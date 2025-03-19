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

import { Appointment, User, EducationalMaterial } from "@/app/models/index";
import sequelize from 'lib/db';
import { Op } from 'sequelize';
import { S3BUCKETNAME } from '@/constants';

const s3 = new AWS.S3({
    endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    s3ForcePathStyle: true,
});




// Fetch a user by ID
const getUserById = async (id) => {
    try {
        const user = await User.findByPk(id); // Sequelize `findByPk` to find by primary key (ID)
        return user;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new Error('Failed to fetch user by ID');
    }
};

// Fetch a user by email or phone (excluding a specific user)
const getUserByEmailOrPhoneExcludingId = async (email, phone, userId) => {
    try {
        const user = await User.findAll({
            where: {
                [Op.or]: [{ email }, { phone }],
                id: { [Op.ne]: userId }, // Exclude current user by ID
            },
        });
        return user;
    } catch (error) {
        console.error('Error checking for existing user:', error);
        throw new Error('Failed to check for existing user');
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Handle PUT request for updating user by ID
// Handle PUT request for updating user by ID
export async function PUT(req, { params }) {
    const { id } = await params;

    try {
        const existingUser = await getUserById(id);
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { name, phone, email, password, role, imageUrl } = await req.json();

        // Check for duplicate email or phone (excluding the current user)
        if (email || phone) {
            const existingDuplicate = await getUserByEmailOrPhoneExcludingId(
                email || existingUser.email,
                phone || existingUser.phone,
                id
            );

            if (existingDuplicate.length > 0) {
                return NextResponse.json(
                    { error: 'Email or phone number must be unique' },
                    { status: 400 }
                );
            }
        }

        // If a new image is provided, and it differs from the current image, delete the old image from S3
        if (imageUrl && imageUrl !== existingUser.imageUrl) {
            // Delete the old image from S3 if it exists
            if (existingUser.imageUrl) {
                try {
                    const oldFileName = existingUser.imageUrl.split('/').pop(); // Extract the file name from the image URL

                    const deleteParams = {
                        Bucket: S3BUCKETNAME,
                        Key: oldFileName, // Extract the file name from the URL
                    };
                    console.log(deleteParams);

                    await s3.deleteObject(deleteParams).promise();
                    console.log(`Successfully deleted old image: ${oldFileName} from S3.`);
                } catch (error) {
                    console.error('Error deleting old image from S3:', error);
                    return NextResponse.json({ error: 'Failed to delete old image from S3' }, { status: 500 });
                }
            }
        }

        // Prepare updated user object
        const updatedUser = {
            name: name || existingUser.name,
            phone: phone || existingUser.phone,
            email: email || existingUser.email,
            password: password ? bcrypt.hashSync(password, 10) : existingUser.password,
            role: role || existingUser.role,
            imageUrl: imageUrl || existingUser.imageUrl, // Update image URL only if provided
        };

        // Update the user in the database
        await existingUser.update(updatedUser);
        const updatedSession = {
            user: {
                ...existingUser.toJSON(),
                imageUrl: updatedUser.imageUrl || existingUser.imageUrl,
                name: updatedUser.name || existingUser.name,
                phone: updatedUser.phone || existingUser.phone,
            }
        };

        // Return updated user data and session
        return NextResponse.json({ updatedUser, updatedSession }, { status: 200 });
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}


// Handle DELETE request for deleting user by ID
export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        // Fetch the user by ID
        const user = await getUserById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If the user has an associated imageUrl, delete the image from S3
        if (user.imageUrl) {
            try {
                // Extract the file name from the image URL (assuming the image URL is an S3 URL)
                const fileName = user.imageUrl.split('/').pop();


                // Define the parameters for deleting the file from S3
                const deleteParams = {
                    Bucket: S3BUCKETNAME, // S3 bucket name
                    Key: fileName, // Extract the file name from the URL
                };

                // Delete the image from S3
                await s3.deleteObject(deleteParams).promise();
                console.log(`Successfully deleted image: ${fileName} from S3.`);
            } catch (error) {
                console.error('Error deleting image from S3:', error);
                return NextResponse.json({ error: 'Failed to delete image from S3' }, { status: 500 });
            }
        }

        // Delete the user from the database
        await user.destroy(); // Sequelize `destroy` method to delete the user

        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
