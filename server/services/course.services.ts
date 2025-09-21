import { NextFunction, Response } from "express";
import CourseModel from "../models/course.models";
import CatchAsyncError from "../middlewares/catchAsyncErrors";


// Create a new Course
export const createCourse = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
    const course = await CourseModel.create(data);
    return res.status(201).json({ success: true, message: "Course created successfully", course });
});

export const getAllCoursesServices = async(res: Response) => {
    const courses = await CourseModel.find().sort({createdAt: -1});
    res.status(201).json({
        success: true,
        courses
    });
}
