import { RequestHandler, Request, Response, NextFunction } from "express";

const catchAsync = (fn: any): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export default catchAsync;