import mongoose, { Document, Schema , Model}  from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    status: string,
    userId: string;
}

const notificationSchema = new Schema<INotification>({
    userId: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent"
    },
    title: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const NotificationModel: Model<INotification> = mongoose.model("Notification", notificationSchema);
