import { NextFunction, Request, Response } from 'express';
import CatchAsyncError from '../middlewares/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';
import { createCourse } from '../services/course.services';
import CourseModel from '../models/course.models';
import { getRedis } from '../utils/redis';
import mongoose from 'mongoose';
import path from 'path';
import ejs from "ejs";
import sendMail from '../utils/sendMail';



// Upload course 
export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        console.log(data.thumbnail)
        const thumbnail = data.thumbnail;

        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail.url, {
                folder: "courses",
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        await createCourse(data, res, next);
    } catch (error: any) {
        console.error("Upload error:", error);
        return next(new ErrorHandler(error.message || "Image upload failed", 400));
    }
});

export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for editing a course
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            await cloudinary.v2.uploader.destroy(thumbnail.public_id);
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail.url, {
                folder: "uploads/",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const courseId = req.params.id;
        const updatedCourse = await CourseModel.findByIdAndUpdate(
            courseId,
            { $set: data },
            { new: true }
        );

        res.status(200).json({ success: true, message: "Edit course endpoint", updatedCourse });
    } catch (error) {
        return next(new ErrorHandler("Failed to edit course", 400));
    }
}
);


// Get Single Course
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;
    const isCacheExist = await getRedis().get(`${courseId}`);
    if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        return res.status(200).json({
            success: true,
            course
        })
    } else {
        const course = await CourseModel.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        res.status(200).json({
            success: true,
            course
        })
        await getRedis().set(`${courseId}`, JSON.stringify(course));

        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        res.status(200).json({ success: true, course });
    }


}
);

// Get all Courses without purchased

export const getAllCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const isCacheExist = await getRedis().get(`allCourses`);
    if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        return res.status(200).json({
            success: true,
            courses
        })
    } else {

        const courses = await CourseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        await getRedis().set(`allCourses`, JSON.stringify(courses));

        res.status(200).json({
            success: true,
            courses
        })
    }
}
);


// Get course content only for valid user
export const getCourseByUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const courseId = req.params.id;
    const userCourseList = req.user?.courses || [];
    const courseExists = userCourseList.find((course: any) => {
        console.log(course._id.toString(), courseId)
        return course._id.toString() === courseId;
    });
    if (!courseExists) {
        return next(new ErrorHandler("You are not eligible to access this course", 404));
    }
    const course = await CourseModel.findById(courseId);
    const content = course?.courseData;
    res.status(200).json({
        success: true,
        content
    })
}
);


// Add Question in course
interface IAddQuestionBody {
    question: string;
    courseId: string;
    contentId: string;
}
export const addQuestion = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { question, courseId, contentId } = req.body as IAddQuestionBody;
        const course = await CourseModel.findById(courseId);
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new ErrorHandler("Invalid courseId", 400));
        }

        const courseContent = course?.courseData.find((item: any) => item._id?.toString() === contentId);

        if (!courseContent) {
            return next(new ErrorHandler("Course content not found", 404));
        }

        // Create a new question object
        const newQuestion: any = {
            user: req.user,
            question,
            questionReplies: []
        };
        // Add the new question to the questions array
        courseContent.questions.push(newQuestion);
        await course?.save();
        
        res.status(200).json({
            success: true,
            message: "Question added successfully",
            question: newQuestion,
            course
        });

    }
);


// Add Answer in course question

interface IAddAnswerBody {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { answer, courseId, contentId, questionId } = req.body as IAddAnswerBody;
        const course = await CourseModel.findById(courseId);
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new ErrorHandler("Invalid courseId", 400));
        }
        
        const courseContent = course?.courseData.find((item: any) => item._id?.toString() === contentId);
        if (!courseContent) {
            return next(new ErrorHandler("Course content not found", 404));
        }
        
        const question = courseContent.questions.find((q: any) => q._id?.toString() === questionId);
        if (!question) {
            return next(new ErrorHandler("Question not found", 404));
        }
        
        // Create a new answer object
        const newAnswer: any = {
            user: req.user,
            answer,
        };
        
        // Add the new answer to the questionReplies array
        question.questionReplies.push(newAnswer);
        await course?.save();
        if(req.user?._id === question.user?._id){
            // return next(new ErrorHandler("You cannot answer your own question", 400));
        }else{
            const data =  {
                name: question.user?.name,
                title: courseContent?.title,
            }
            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), {data});
            try {
                await sendMail({
                    email: question.user?.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data
                });
            } catch (error : any) {
                return next(new ErrorHandler(error.message, 500));
            }
        }   
        res.status(200).json({
            success: true,
            message: "Answer added successfully",
            course
        });
    }
);


// Add Review in course
interface IAddReviewBody {
    review: string;
    rating: number;
    courseId: string;
}

export const addReview = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    const userCourseList = req.user?.courses || [];
    const courseId = req.params.id;
    const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId);
    if (courseExists) {
        return next(new ErrorHandler("You are not eligible to review this course", 404));
    }

    const course = await CourseModel.findById(courseId);
    const { review, rating } = req.body as IAddReviewBody;
    const reviewData : any= {
        user: req.user,
        comment: review,
        rating
    }
    course?.reviews.push(reviewData);
    let avg = 0;
    course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
    });
    if(course){
        course.ratings = avg / course.reviews.length;
    }
    await course?.save();
    const notification = {
        title: "New Review",
        message: `${req.user?.name} has added a new review on ${course?.name} course`,
    }
    res.status(201).json({
        success: true,
        message: "Review added successfully",
        course
    });
});


// Add Reply in review
interface IAddReplyBody {
    comment: string;
    courseId: string;
    reviewId: string;
}
export const addReplyToReview = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    const { comment, courseId, reviewId } = req.body as IAddReplyBody;
    const course = await CourseModel.findById(courseId);
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Invalid courseId", 400));
    }
    
    const review = course?.reviews.find((rev: any) => rev._id?.toString() === reviewId);

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }
    
    const newReply: any = {
        user: req.user,
        comment,
    }; 
    if(!review.commentReplies){
        review.commentReplies = [];
    }
    
    review.commentReplies.push(newReply);
    // course?.reviews.commentReplies.push(newReply);
    await course?.save();
    
    res.status(200).json({
        success: true,
        message: "Reply added successfully",
        course
    });
}
);