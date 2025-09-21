import { NextFunction, Response, Request } from "express";
import CatchAsyncError from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel, { IOrder } from "../models/order.models";
import UserModel from "../models/user.models";
import CourseModel from "../models/course.models";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
// import sendMail from "../utils/sendEmail";
import { INotification, NotificationModel } from "../models/notification.models";
import { getAllOrdersServices, newOrder } from "../services/order.serviecs";
import sendMail from "../utils/sendMail";


// Create a new order
export const createOrder = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { courseId, payment_info } = req.body as IOrder;
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new ErrorHandler("Invalid courseId", 400));
        }
        const user = await UserModel.findById(req.user?._id);
        const courseExists = user?.courses.some((c: any) => c._id.toString() === courseId);
        if (courseExists) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const data: any = {
            courseId: course._id,
            userId: user?._id,
            payment_info
        }

        // const mailData = {
        //     order: {
        //         _id: (course?._id as any).toString().slice(0, 6),
        //         name: course?.name,
        //         price: course?.price,
        //         date: new Date().toLocaleDateString("en-US", {
        //             year: "numeric",
        //             month: "numeric",
        //             day: "numeric",
        //         }),
        //     }
        // }
        // const html = await ejs.renderFile(path.join(__dirname, "../mails/order-confirmation.ejs"), {
        //     order: mailData
        // });

        // try {
        //     if (user) {
        //         await sendMail({
        //             email: user.email,
        //             subject: "Order Confirmation - Your Course Purchase",
        //             template: "order-confirmation.ejs",
        //             data: mailData,
        //         })
        //     }
        // } catch (error) {
        //     return next(new ErrorHandler("Failed to send order confirmation email", 500));
        // }

        user?.courses.push(course?._id as any);
        await user?.save();

        await NotificationModel.create({
            title: "Course Purchased",
            name: user?.name,
            userId: user?._id,
            message: `You have successfully purchased the course: ${course?.name}`,
        });
        // if(course.purchased !== undefined){
        //     course.purchased += 1;
        // }
        course.purchased ? course.purchased += 1 : course.purchased = 1;
        await course.save();
        newOrder(data, res, next);
    }
);



// Get All Orders -- only for admin

export const getAllOrders = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllOrdersServices(res);
    } catch (error) {
        return next(new ErrorHandler("Failed to fetch orders", 500));
    }
});