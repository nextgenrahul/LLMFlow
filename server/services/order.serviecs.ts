import { NextFunction, Response } from "express";
import CatchAsyncError from "../middlewares/catchAsyncErrors";
import OrderModel from "../models/order.models";



// Create a new order
// export const createOrder = CatchAsyncError(
//     async (data: any, next: NextFunction) => {
//         const order = await OrderModel.create(data);
//         next(order);
//     });

export const newOrder = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
    const order = await OrderModel.create(data);
    res.status(201).json({
        success: true,
        message: "Order created successfully",
        order
    });
});


// Get all Orders 

export const getAllOrdersServices = async(res: Response) => {
    const orders = await OrderModel.find().sort({createdAt: -1});
    res.status(201).json({
        success: true,
        orders
    });
}

