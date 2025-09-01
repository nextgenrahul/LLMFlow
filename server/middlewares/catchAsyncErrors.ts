import { Request, Response, NextFunction } from "express";

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const CatchAsyncError = (theFunc: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
  };
};

export default CatchAsyncError;
