// import { NextResponse } from "next/server";
// import AWS from "aws-sdk";
// import { S3BUCKETNAME } from "@/constants";

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

// const TABLE_NAME = "educationalMaterials";

// // ✅ GET MATERIAL BY ID
// export async function GET(req, { params }) {
//     const { materialId } = params;

//     try {
//         const result = await dynamoDb
//             .get({
//                 TableName: TABLE_NAME,
//                 Key: { materialId: materialId },
//             })
//             .promise();

//         if (!result.Item) {
//             return NextResponse.json({ error: "Material not found" }, { status: 404 });
//         }

//         return NextResponse.json(result.Item, { status: 200 });
//     } catch (error) {
//         console.error("Error fetching material by materialId:", error);
//         return NextResponse.json({ error: "Failed to fetch material" }, { status: 500 });
//     }
// }

// // ✅ UPDATE MATERIAL BY ID
// export async function PUT(req, { params }) {
//     const { id } = await params;
//     const materialId = id;
//     const { name, description, uploadedBy, fileUrl, tags } = await req.json();

//     try {
//         // Fetch the existing material to check if there is an old file URL
//         const existingMaterial = await dynamoDb
//             .get({
//                 TableName: TABLE_NAME,
//                 Key: { materialId: materialId },
//             })
//             .promise();

//         const oldFileUrl = existingMaterial.Item ? existingMaterial.Item.fileUrl : null;

//         // If there is a new file URL and it's different from the old one, delete the old file from S3
//         if (fileUrl && oldFileUrl && oldFileUrl !== fileUrl) {
//             const deleteParams = {
//                 Bucket: S3BUCKETNAME, // The name of the S3 bucket
//                 Key: decodeURIComponent(oldFileUrl.split("/").pop()), // The file path to delete
//             };

//             // Ensure that the Bucket is correctly set and file URL exists
//             if (!deleteParams.Bucket || !deleteParams.Key) {
//                 throw new Error("Bucket name or file path is missing.");
//             }

//             // Delete old file from S3
//             try {
//                 const deleteResponse = await s3.deleteObject(deleteParams).promise();
//                 console.log("Delete response:", deleteResponse); // Log the delete response to check success

//             } catch (error) {
//                 console.error("Error deleting object from S3:", error);
//             }

//         }

//         // Check if name exists for other IDs
//         const existing = await dynamoDb
//             .scan({
//                 TableName: TABLE_NAME,
//                 FilterExpression: "#n = :name AND materialId <> :materialId",
//                 ExpressionAttributeNames: { "#n": "name" },
//                 ExpressionAttributeValues: { ":name": name, ":materialId": materialId },
//             })
//             .promise();

//         if (existing.Items.length > 0) {
//             return NextResponse.json(
//                 { error: "Material name already exists for another record" },
//                 { status: 400 }
//             );
//         }

//         await dynamoDb
//             .update({
//                 TableName: TABLE_NAME,
//                 Key: { materialId: materialId },
//                 UpdateExpression:
//                     "set #n = :name, description = :description, uploadedBy = :uploadedBy, fileUrl = :fileUrl, tags = :tags",
//                 ExpressionAttributeNames: { "#n": "name" },
//                 ExpressionAttributeValues: {
//                     ":name": name,
//                     ":description": description,
//                     ":uploadedBy": uploadedBy,
//                     ":fileUrl": fileUrl,
//                     ":tags": tags,
//                 },
//             })
//             .promise();

//         return NextResponse.json({ message: "Material updated successfully" }, { status: 200 });
//     } catch (error) {
//         console.error("Error updating material:", error);
//         return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
//     }
// }


// // ✅ DELETE MATERIAL BY ID
// export async function DELETE(req, { params }) {
//     // Extract the materialId from params
//     const { id } = await params;
//     const materialId = id;

//     try {
//         // Fetch the existing material from DynamoDB to check if there is a file URL
//         const existingMaterial = await dynamoDb
//             .get({
//                 TableName: TABLE_NAME,
//                 Key: { materialId: materialId },
//             })
//             .promise();

//         // Ensure the material exists in DynamoDB before proceeding
//         if (!existingMaterial.Item) {
//             return NextResponse.json({ error: "Material not found" }, { status: 404 });
//         }

//         const fileUrl = existingMaterial.Item.fileUrl;

//         if (fileUrl) {
//             const deleteParams = {
//                 Bucket: S3BUCKETNAME, // The name of the S3 bucket
//                 Key: decodeURIComponent(fileUrl.split("/").pop()), // The file path to delete
//             };
//             // Ensure that the Bucket and Key are valid
//             if (!deleteParams.Bucket || !deleteParams.Key) {
//                 throw new Error("Bucket name or file path is missing.");
//             }
//             console.log("detelteParams", deleteParams);
//             // Delete the file from S3
//             try {
//                 await s3.deleteObject(deleteParams).promise();
//             } catch (error) {
//                 console.error("Error deleting object from S3:", error);
//             }
//         }

//         // Delete the material entry from DynamoDB
//         await dynamoDb
//             .delete({
//                 TableName: TABLE_NAME,
//                 Key: { materialId: materialId },
//             })
//             .promise();

//         return NextResponse.json({ message: "Material deleted successfully" }, { status: 200 });
//     } catch (error) {
//         console.error("Error deleting material:", error);
//         return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
//     }
// }

import { NextResponse } from "next/server";
import { S3BUCKETNAME } from "@/constants";
import AWS from "aws-sdk";

import { Appointment, User, EducationalMaterial } from "@/app/models/index";

// Initialize S3
const s3 = new AWS.S3({
    endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    s3ForcePathStyle: true,
});

// ✅ GET MATERIAL BY ID
export async function GET(req, { params }) {
    const { materialId } = params;

    try {
        const material = await EducationalMaterial.findByPk(materialId); // Fetch material by primary key (materialId)
        if (!material) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        return NextResponse.json(material, { status: 200 });
    } catch (error) {
        console.error("Error fetching material by materialId:", error);
        return NextResponse.json({ error: "Failed to fetch material" }, { status: 500 });
    }
}

// ✅ UPDATE MATERIAL BY ID
export async function PUT(req, { params }) {
    const { id } = params;
    const { name, description, uploadedBy, fileUrl, tags } = await req.json();

    try {
        // Check for duplicate name
        const existing = await EducationalMaterial.findOne({
            where: { name, materialId: { [Op.ne]: id } }, // Exclude current materialId
        });

        if (existing) {
            return NextResponse.json(
                { error: "Material name already exists for another record" },
                { status: 400 }
            );
        }

        // Fetch the existing material
        const existingMaterial = await EducationalMaterial.findByPk(id);
        if (!existingMaterial) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        const oldFileUrl = existingMaterial.fileUrl;

        // If file URL has changed, delete the old file from S3
        if (fileUrl && oldFileUrl && oldFileUrl !== fileUrl) {
            const deleteParams = {
                Bucket: S3BUCKETNAME,
                Key: decodeURIComponent(oldFileUrl.split("/").pop()),
            };

            if (deleteParams.Bucket && deleteParams.Key) {
                try {
                    await s3.deleteObject(deleteParams).promise();
                } catch (error) {
                    console.error("Error deleting object from S3:", error);
                }
            }
        }

        // Update the material record in the database
        await existingMaterial.update({
            name,
            description,
            uploadedBy,
            fileUrl,
            tags,
        });

        return NextResponse.json({ message: "Material updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating material:", error);
        return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
    }
}

// ✅ DELETE MATERIAL BY ID
export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        const existingMaterial = await EducationalMaterial.findByPk(id);
        if (!existingMaterial) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        const fileUrl = existingMaterial.fileUrl;
        if (fileUrl) {
            const deleteParams = {
                Bucket: S3BUCKETNAME,
                Key: decodeURIComponent(fileUrl.split("/").pop()),
            };

            if (deleteParams.Bucket && deleteParams.Key) {
                try {
                    await s3.deleteObject(deleteParams).promise();
                } catch (error) {
                    console.error("Error deleting object from S3:", error);
                }
            }
        }

        await existingMaterial.destroy(); // Delete the material from the database

        return NextResponse.json({ message: "Material deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting material:", error);
        return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
    }
}
