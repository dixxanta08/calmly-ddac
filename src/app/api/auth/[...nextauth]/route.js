// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";

// import AWS from 'aws-sdk';
// import bcrypt from 'bcryptjs';

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
// });

// // Fetch a user by email
// const getUserByEmail = async (email) => {
//     const params = {
//         TableName: 'users',
//         Key: { email }, // Assuming 'email' is the primary key
//     };

//     try {
//         const result = await dynamoDb.get(params).promise();
//         return result.Item || null;
//     } catch (error) {
//         console.error("Error fetching user:", error);
//         throw new Error('Error fetching user by email');
//     }
// };

// const handler = NextAuth({
//     providers: [
//         CredentialsProvider({
//             name: "Credentials",
//             credentials: {
//                 email: { label: "Email", type: "text" },
//                 password: { label: "Password", type: "password" }
//             },
//             async authorize(credentials) {
//                 if (!credentials?.email || !credentials?.password) {
//                     throw new Error("Missing credentials");
//                 }

//                 // Fetch user by email from DynamoDB
//                 const user = await getUserByEmail(credentials.email);
//                 if (!user) {
//                     throw new Error("Invalid email or password");
//                 }

//                 // Validate password using bcrypt
//                 const isValid = await bcrypt.compare(credentials.password, user.password);
//                 if (!isValid) {
//                     throw new Error("Invalid email or password");
//                 }

//                 // If valid, return user object
//                 return {
//                     id: user.id,
//                     email: user.email,
//                     name: user.name, // Optional: Include other user fields if needed
//                 };
//             }
//         })
//     ],
//     pages: {
//         signIn: "/login", // Optional: Custom login page
//     },
//     session: {
//         strategy: "jwt", // Use JWT for session handling (optional)
//     },
//     callbacks: {
//         async jwt({ token, user }) {
//             if (user) {
//                 token.id = user.id;
//                 token.email = user.email;
//                 token.name = user.name;
//             }
//             return token;
//         },
//         async session({ session, token }) {
//             if (token) {
//                 session.user.id = token.id;
//                 session.user.email = token.email;
//                 session.user.name = token.name;
//             }
//             return session;
//         }
//     }
// });

// export const GET = handler;
// export const POST = handler;


// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import User from "@/app/models/User"; // Assuming User model is exported from here

// export async function POST(req) {
//     try {
//         const { email, password, name, phoneNumber: phone } = await req.json();
//         console.log("Creating user with email:", email);


//         // Validate the input
//         if (!email || !password || !name || !phone) {
//             return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create a new user in the database using Sequelize
//         const newUser = await User.create({
//             email,
//             password: hashedPassword,
//             name,
//             phone,
//         });

//         // Respond with the newly created user (or a success message)
//         return NextResponse.json({ message: "User created successfully", user: newUser }, { status: 201 });
//     } catch (error) {
//         console.error("Error creating user:", error);
//         return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
//     }
// }
// // 





import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (credentials?.trigger === "refresh") {
                    // For session refresh, do not require password, just fetch user by email
                    const params = {
                        TableName: 'users',
                        FilterExpression: 'email = :email',
                        ExpressionAttributeValues: {
                            ':email': credentials.email
                        }
                    };

                    const result = await dynamoDb.scan(params).promise();
                    const user = result.Items[0];

                    if (!user) {
                        throw new Error("Invalid email or password");
                    }

                    // Return user details without validating password
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        phone: user.phone,
                        role: user.role,
                        imageUrl: user.imageUrl,
                    };
                }

                // Standard authentication (login)
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                const params = {
                    TableName: 'users',
                    FilterExpression: 'email = :email',
                    ExpressionAttributeValues: {
                        ':email': credentials.email
                    }
                };

                const result = await dynamoDb.scan(params).promise();
                const user = result.Items[0];

                if (!user) {
                    throw new Error("Invalid email or password");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    imageUrl: user.imageUrl,
                };
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
                token.phone = user.phone;
                token.imageUrl = user.imageUrl;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.role = token.role;
                session.user.phone = token.phone;
                session.user.imageUrl = token.imageUrl;
            }
            return session;
        }
    }
});

export const GET = handler;
export const POST = handler;
