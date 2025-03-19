import { NextResponse } from "next/server";
import multer from "multer";
import multerS3 from "multer-s3";
import AWS from "aws-sdk";
import { S3BUCKETNAME } from "@/constants";

// Configure AWS SDK for LocalStack
const s3 = new AWS.S3({
    endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
    signatureVersion: process.env.NEXT_PUBLIC_S3_SIGNATURE_VERSION,
    s3ForcePathStyle: true, // Ensure path-style access for LocalStack
});

// Multer S3 storage configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: S3BUCKETNAME,
        key: function (req, file, cb) {
            cb(null, `${Date.now()}_${file.originalname}`);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read', // Adjust based on your S3 bucket's access policy
    }),
}).single("file");

// Custom middleware to handle `req` properly
const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
};

export async function POST(req) {
    // Manually parse request since Next.js doesn’t support multer out of the box
    const formData = await req.formData();
    console.log("Form data:", formData);
    const file = formData.get('file');
    console.log("Uploaded file:", file);

    if (!file) {
        return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // Convert FormData to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
        const params = {
            Bucket: S3BUCKETNAME,
            Key: `${Date.now()}_${file.name}`,
            Body: buffer,
            ContentType: file.type, // Set the correct content type
        };

        console.log("Params:", params);
        const uploadResult = await s3.upload(params).promise(); // Upload to S3
        console.log("Upload result:", uploadResult);

        return NextResponse.json({
            message: "File uploaded successfully",
            url: uploadResult.Location,
            name: file.name,
        });
    } catch (err) {
        console.error("Upload error:", err);
        return NextResponse.json({ message: "Upload failed", error: err.message }, { status: 500 });
    }
}
