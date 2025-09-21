import { NotificationModel } from "../models/notification.models";
import { NextFunction, Request, Response } from "express";
import CatchAsyncError from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron";

export const getNotificaton = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const notifications = await NotificationModel.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        notifications
    });
});


// Update Notification Status -- only admin
export const updateNotification = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const notificationId = req.params.id;
    if (!notificationId) {
        return next(new ErrorHandler("Notification ID is required", 400));
    }

    const notification = await NotificationModel.findById(notificationId);

    if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
    } else {
        notification.status ? notification.status = "read" : notification.status = "unread";
    }

    await notification.save();
    const notifications = await NotificationModel.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        message: "Notification status updated",
        notifications
    });
});



// Cron job to delete old notifications
cron.schedule("0 0 0 * * *", async () =>  {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await NotificationModel.deleteMany({status: "read", createdAt: {$lt: thirtyDaysAgo}});
    console.log("Deleted read notifications");
})