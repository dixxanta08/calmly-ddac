import { NextResponse } from "next/server";
import AWS from "aws-sdk";
import { S3BUCKETNAME } from "@/constants";

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

// POST - Create Educational Material
export async function POST(req) {
    const { materialId, name, description, uploadedBy, fileUrl, tags } = await req.json();
    try {
        // Check if name already exists in the database
        const existingResult = await dynamoDb.scan({
            TableName: 'educationalMaterials',
            FilterExpression: '#n = :name',
            ExpressionAttributeNames: {
                '#n': 'name'
            },
            ExpressionAttributeValues: {
                ':name': name
            }
        }).promise();

        if (existingResult.Items.length > 0) {
            return NextResponse.json(
                { error: "Material with this name already exists" },
                { status: 400 }
            );
        }

        // Create new material record
        const newMaterial = {
            materialId,
            name,
            description,
            uploadedBy,
            fileUrl,
            tags,
            createdAt: new Date().toISOString()
        };

        await dynamoDb.put({
            TableName: 'educationalMaterials',
            Item: newMaterial
        }).promise();

        return NextResponse.json(newMaterial, { status: 201 });
    } catch (error) {
        if (fileUrl) {
            const deleteParams = {
                Bucket: S3BUCKETNAME,
                Key: fileUrl.split("/").pop(),
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

export async function GET(request) {
    try {
        const uploadedBy = request.nextUrl.searchParams.get('uploadedBy');
        let params = {
            TableName: 'educationalMaterials'
        };

        if (uploadedBy) {
            params.FilterExpression = 'uploadedBy = :uploadedBy';
            params.ExpressionAttributeValues = {
                ':uploadedBy': uploadedBy
            };
        }

        const result = await dynamoDb.scan(params).promise();
        return NextResponse.json(result.Items, { status: 200 });
    } catch (error) {
        console.error("Error fetching materials:", error);
        return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
    }
}
