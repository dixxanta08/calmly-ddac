// const AWS = require('aws-sdk');
// const { S3BUCKETNAME } = require('../../src/constants');

// // Initialize S3 client
// const s3 = new AWS.S3({
//     region: process.env.AWS_REGION || 'us-east-1',
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     // For local development with LocalStack
//     ...(process.env.IS_OFFLINE && {
//         endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
//         s3ForcePathStyle: true,
//     }),
// });

// // Lambda handler function
// exports.handler = async (event) => {
//     console.log('Event:', JSON.stringify(event, null, 2));

//     // Set CORS headers
//     const headers = {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
//         'Access-Control-Allow-Methods': 'POST,OPTIONS',
//         'Content-Type': 'application/json'
//     };

//     // Handle OPTIONS request for CORS
//     if (event.httpMethod === 'OPTIONS') {
//         return {
//             statusCode: 200,
//             headers,
//             body: ''
//         };
//     }

//     try {
//         // Handle POST request
//         if (event.httpMethod === 'POST') {
//             // Check if the request has a file
//             if (!event.body || !event.isBase64Encoded) {
//                 return {
//                     statusCode: 400,
//                     headers,
//                     body: JSON.stringify({ message: "No file uploaded" })
//                 };
//             }

//             // Parse the base64 encoded body
//             const body = Buffer.from(event.body, 'base64');

//             // Get file name and content type from headers
//             const contentType = event.headers['content-type'] || 'application/octet-stream';
//             const fileName = event.headers['x-file-name'] || `file-${Date.now()}`;

//             // Upload to S3
//             const params = {
//                 Bucket: S3BUCKETNAME,
//                 Key: `${Date.now()}_${fileName}`,
//                 Body: body,
//                 ContentType: contentType,
//                 ACL: 'public-read',
//             };

//             const uploadResult = await s3.upload(params).promise();

//             return {
//                 statusCode: 200,
//                 headers,
//                 body: JSON.stringify({
//                     message: "File uploaded successfully",
//                     url: uploadResult.Location,
//                     name: fileName,
//                 })
//             };
//         }

//         // Handle unsupported methods
//         return {
//             statusCode: 405,
//             headers,
//             body: JSON.stringify({ error: "Method not allowed" })
//         };
//     } catch (error) {
//         console.error("Upload error:", error);
//         return {
//             statusCode: 500,
//             headers,
//             body: JSON.stringify({
//                 message: "Upload failed",
//                 error: error.message
//             })
//         };
//     }
// }; 