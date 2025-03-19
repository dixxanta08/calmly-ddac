// import { NextResponse } from "next/server";
// import AWS from "aws-sdk";
// import { EDUCATIONALMATERIALSTABLENAME, S3BUCKETNAME } from "@/constants";

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT, // LocalStack endpoint
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
// });


// const s3 = new AWS.S3({
//     endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
//     accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
//     s3ForcePathStyle: true,
// });



// export async function POST(req) {
//     const { materialId, name, description, uploadedBy, fileUrl, tags } = await req.json();
//     try {
//         // Check if name already exists
//         const existing = await dynamoDb
//             .scan({
//                 TableName: EDUCATIONALMATERIALSTABLENAME,
//                 FilterExpression: "#n = :name",
//                 ExpressionAttributeNames: { "#n": "name" },
//                 ExpressionAttributeValues: { ":name": name },
//             })
//             .promise();

//         if (existing.Items.length > 0) {
//             return NextResponse.json(
//                 { error: "Material with this name already exists" },
//                 { status: 400 }
//             );
//         }

//         const newMaterial = {
//             materialId,
//             name,
//             description,
//             uploadedBy,
//             fileUrl,
//             tags,
//             createdAt: new Date().toISOString(),
//         };

//         await dynamoDb
//             .put({
//                 TableName: EDUCATIONALMATERIALSTABLENAME,
//                 Item: newMaterial,
//             })
//             .promise();

//         return NextResponse.json(newMaterial, { status: 201 });
//     } catch (error) {
//         if (fileUrl) {
//             const deleteParams = {
//                 Bucket: S3BUCKETNAME, // Replace with your actual bucket name
//                 Key: fileUrl.split("/").pop(), // Assuming the file URL has the filename as the last part
//             };

//             try {
//                 await s3.deleteObject(deleteParams).promise();
//                 console.log("File deleted from S3 due to error");
//             } catch (deleteError) {
//                 console.error("Error deleting file from S3:", deleteError);
//             }
//         }

//         console.error("Error creating material:", error);
//         return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
//     }
// }

// // ✅ GET ALL MATERIALS
// export async function GET() {
//     try {
//         const data = await dynamoDb
//             .scan({
//                 TableName: EDUCATIONALMATERIALSTABLENAME,
//             })
//             .promise();

//         return NextResponse.json(data.Items, { status: 200 });
//     } catch (error) {
//         console.error("Error fetching materials:", error);
//         return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
//     }
// }

import { NextResponse } from "next/server";
import AWS from "aws-sdk";

import { Appointment, User, EducationalMaterial } from "@/app/models/index";

import { S3BUCKETNAME } from "@/constants";  // S3 bucket name constant

const s3 = new AWS.S3({
    endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    s3ForcePathStyle: true,
});

// POST - Create Educational Material
export async function POST(req) {
    const { materialId, name, description, uploadedBy, fileUrl, tags } = await req.json();
    try {
        // Check if name already exists in the database
        const existing = await EducationalMaterial.findOne({
            where: {
                name,  // Check for existing material with the same name
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Material with this name already exists" },
                { status: 400 }
            );
        }

        // Create new material record
        const newMaterial = await EducationalMaterial.create({
            materialId,
            name,
            description,
            uploadedBy,
            fileUrl,
            tags,
            createdAt: new Date(),
        });

        return NextResponse.json(newMaterial, { status: 201 });
    } catch (error) {
        // If an error occurs, delete the file from S3 if it was uploaded
        if (fileUrl) {
            const deleteParams = {
                Bucket: S3BUCKETNAME, // Replace with your actual bucket name
                Key: fileUrl.split("/").pop(), // Extract the file name from the URL
            };

            try {
                await s3.deleteObject(deleteParams).promise();
                console.log("File deleted from S3 due to error");
            } catch (deleteError) {
                console.error("Error deleting file from S3:", deleteError);
            }
        }

        console.error("Error creating material:", error);
        return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
    }
}

// ✅ GET ALL MATERIALS
// export async function GET() {
//     try {
//         const materials = await EducationalMaterial.findAll();

//         return NextResponse.json(materials, { status: 200 });
//     } catch (error) {
//         console.error("Error fetching materials:", error);
//         return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
//     }
// }

export async function GET(request) {
    try {
        const uploadedBy = request.nextUrl.searchParams.get('uploadedBy');
        let materials;
        if (uploadedBy) {
            materials = await EducationalMaterial.findAll({
                where: {
                    uploadedBy: uploadedBy
                }
            });
        } else {
            materials = await EducationalMaterial.findAll();
        }

        return NextResponse.json(materials, { status: 200 });
    } catch (error) {
        console.error("Error fetching materials:", error);
        return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
    }
}
