import Joi from "joi";

const createSampleValidator = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().trim().allow(""),
  isActive: Joi.boolean(),
});

const updateSampleValidator = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim().allow(""),
  isActive: Joi.boolean(),
});

export { createSampleValidator, updateSampleValidator };
