import { NextResponse } from "next/server";
import { S3BUCKETNAME } from "@/constants";
import AWS from "aws-sdk";

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

// ✅ GET MATERIAL BY ID
export async function GET(req, { params }) {
    const { materialId } = params;

    try {
        const result = await dynamoDb.get({
            TableName: 'educationalMaterials',
            Key: { materialId }
        }).promise();

        if (!result.Item) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        return NextResponse.json(result.Item, { status: 200 });
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
        const existingResult = await dynamoDb.scan({
            TableName: 'educationalMaterials',
            FilterExpression: '#n = :name AND materialId <> :id',
            ExpressionAttributeNames: {
                '#n': 'name'
            },
            ExpressionAttributeValues: {
                ':name': name,
                ':id': id
            }
        }).promise();

        if (existingResult.Items.length > 0) {
            return NextResponse.json(
                { error: "Material name already exists for another record" },
                { status: 400 }
            );
        }

        // Fetch the existing material
        const existingMaterialResult = await dynamoDb.get({
            TableName: 'educationalMaterials',
            Key: { materialId: id }
        }).promise();

        if (!existingMaterialResult.Item) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        const oldFileUrl = existingMaterialResult.Item.fileUrl;

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

        // Update the material record in DynamoDB
        await dynamoDb.update({
            TableName: 'educationalMaterials',
            Key: { materialId: id },
            UpdateExpression: 'set #n = :name, description = :description, uploadedBy = :uploadedBy, fileUrl = :fileUrl, tags = :tags',
            ExpressionAttributeNames: {
                '#n': 'name'
            },
            ExpressionAttributeValues: {
                ':name': name,
                ':description': description,
                ':uploadedBy': uploadedBy,
                ':fileUrl': fileUrl,
                ':tags': tags
            }
        }).promise();

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
        // Get the existing material to check if it exists and get the file URL
        const existingMaterialResult = await dynamoDb.get({
            TableName: 'educationalMaterials',
            Key: { materialId: id }
        }).promise();

        if (!existingMaterialResult.Item) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        const fileUrl = existingMaterialResult.Item.fileUrl;
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

        // Delete the material from DynamoDB
        await dynamoDb.delete({
            TableName: 'educationalMaterials',
            Key: { materialId: id }
        }).promise();

        return NextResponse.json({ message: "Material deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting material:", error);
        return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
    }
}
