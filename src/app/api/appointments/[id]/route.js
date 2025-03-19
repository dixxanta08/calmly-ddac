// import { NextResponse } from "next/server";
// import AWS from "aws-sdk";
// import { APPOINTMENTSTABLENAME } from "@/constants";

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
// });


// export async function PATCH(req, { params }) {
//     const { id } = await params;
//     const {
//         rescheduledDateTime,
//         appointmentDateTime,
//         rescheduledReason,
//         rescheduledBy,
//         cancelledBy,
//         cancelledReason,
//         cancellationDate,
//         meetingLink,
//         feedback,
//         status,
//     } = await req.json();

//     try {
//         let updateExpression = [];
//         let expressionAttributeNames = {};
//         let expressionAttributeValues = {};

//         // Rescheduling updates
//         if (rescheduledDateTime) {
//             updateExpression.push(
//                 "#rdt = :rescheduledDateTime",
//                 "#adt = :appointmentDateTime",
//                 "#rr = :rescheduledReason",
//                 "#rb = :rescheduledBy"
//             );
//             expressionAttributeNames["#rdt"] = "rescheduledDateTime";
//             expressionAttributeNames["#adt"] = "appointmentDateTime";
//             expressionAttributeNames["#rr"] = "rescheduledReason";
//             expressionAttributeNames["#rb"] = "rescheduledBy";
//             expressionAttributeValues[":rescheduledDateTime"] = rescheduledDateTime;
//             expressionAttributeValues[":appointmentDateTime"] = appointmentDateTime;
//             expressionAttributeValues[":rescheduledReason"] = rescheduledReason;
//             expressionAttributeValues[":rescheduledBy"] = rescheduledBy;
//         }

//         // Cancellation updates (set status as "cancelled" only if cancelledBy is present)
//         if (cancelledBy) {
//             updateExpression.push(
//                 "#cb = :cancelledBy",
//                 "#cr = :cancelledReason",
//                 "#cd = :cancellationDate",
//                 "#st = :status"
//             );
//             expressionAttributeNames["#cb"] = "cancelledBy";
//             expressionAttributeNames["#cr"] = "cancelledReason";
//             expressionAttributeNames["#cd"] = "cancellationDate";
//             expressionAttributeNames["#st"] = "status";
//             expressionAttributeValues[":cancelledBy"] = cancelledBy;
//             expressionAttributeValues[":cancelledReason"] = cancelledReason;
//             expressionAttributeValues[":cancellationDate"] = cancellationDate;
//             expressionAttributeValues[":status"] = "cancelled"; // Priority given to cancellation status
//         } else if (status) {
//             // Only update status if it's not set in cancellation
//             updateExpression.push("#st = :status");
//             expressionAttributeNames["#st"] = "status";
//             expressionAttributeValues[":status"] = status;
//         }

//         // Feedback updates
//         if (feedback) {
//             updateExpression.push("#fb = :feedback");
//             expressionAttributeNames["#fb"] = "feedback";
//             expressionAttributeValues[":feedback"] = feedback;
//         }
//         if (meetingLink) {
//             updateExpression.push("#ml = :meetingLink");
//             expressionAttributeNames["#ml"] = "meetingLink";
//             expressionAttributeValues[":meetingLink"] = meetingLink;
//         }
//         if (updateExpression.length === 0) {
//             return NextResponse.json(
//                 { error: "No fields provided for update" },
//                 { status: 400 }
//             );
//         }

//         // Build final UpdateExpression string
//         const finalUpdateExpression = `SET ${updateExpression.join(", ")}`;

//         // Update the item in DynamoDB
//         await dynamoDb
//             .update({
//                 TableName: APPOINTMENTSTABLENAME,
//                 Key: { appointmentId: id },
//                 UpdateExpression: finalUpdateExpression,
//                 ExpressionAttributeNames: expressionAttributeNames,
//                 ExpressionAttributeValues: expressionAttributeValues,
//             })
//             .promise();

//         return NextResponse.json({ message: "Appointment updated successfully" }, { status: 200 });
//     } catch (error) {
//         console.error("Error updating appointment:", error);
//         return NextResponse.json(
//             { error: "Failed to update appointment" },
//             { status: 500 }
//         );
//     }
// }
import { NextResponse } from 'next/server';

import { Appointment, User, EducationalMaterial } from "@/app/models/index";

export async function PATCH(req, { params }) {
    const { id } = params;
    const {
        rescheduledDateTime,
        appointmentDateTime,
        rescheduledReason,
        rescheduledBy,
        cancelledBy,
        cancelledReason,
        cancellationDate,
        meetingLink,
        feedback,
        status,
    } = await req.json();

    try {
        const appointment = await Appointment.findOne({ where: { appointmentId: id } });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Updating rescheduled data
        if (rescheduledDateTime) {
            appointment.rescheduledDateTime = rescheduledDateTime;
            appointment.appointmentDateTime = appointmentDateTime;
            appointment.rescheduledReason = rescheduledReason;
            appointment.rescheduledBy = rescheduledBy;
        }

        // Handle cancellation
        if (cancelledBy) {
            appointment.cancelledBy = cancelledBy;
            appointment.cancelledReason = cancelledReason;
            appointment.cancellationDate = cancellationDate;
            appointment.status = 'cancelled'; // Set the status to 'cancelled' when cancellation details are provided
        } else if (status) {
            appointment.status = status; // Update status if no cancellation
        }

        // Feedback and meeting link updates
        if (feedback) {
            appointment.feedback = feedback;
        }
        if (meetingLink) {
            appointment.meetingLink = meetingLink;
        }

        // Save the updated appointment back to the database
        await appointment.save();

        return NextResponse.json({ message: 'Appointment updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }
}

