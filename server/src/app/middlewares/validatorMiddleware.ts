import { RequestHandler } from "express";
import httpStatus from "http-status";
import Joi from "joi";
import { ZodSchema, ZodError } from "zod";

const validatorMiddleware = (schema: Joi.ObjectSchema | ZodSchema): RequestHandler => {
  return (req, res, next) => {
    const isZodSchema = typeof (schema as any).parse === "function";
    
    try {
      if (isZodSchema) {
        (schema as ZodSchema).parse(req.body);
        next();
      } else {
        (schema as Joi.ObjectSchema).validate(req.body);
        next();
      }
    } catch (error) {
      if (isZodSchema && error instanceof ZodError) {
        const errorMessages = Array.isArray((error as ZodError).issues) ? (error as ZodError).issues : [];
        if (errorMessages.length > 0) {
          res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: errorMessages[0]?.message || "Validation error",
          });
          return;
        }
      } else if (error && typeof error === "object" && "details" in error) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: (error as any).details[0]?.message || "Validation error",
        });
        return;
      }
      next(error);
    }
  };
};

export default validatorMiddleware;