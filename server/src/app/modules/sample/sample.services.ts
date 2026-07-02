import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { ISample } from "./sample.interface";
import SampleModel from "./sample.model";

const createSample = async (payload: ISample) => {
  const result = await SampleModel.create(payload);
  return result;
};

const getAllSamples = async () => {
  const result = await SampleModel.find();
  return result;
};

const getSampleById = async (id: string) => {
  const result = await SampleModel.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Sample not found");
  }
  return result;
};

const updateSample = async (id: string, payload: Partial<ISample>) => {
  const result = await SampleModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Sample not found");
  }
  return result;
};

const deleteSample = async (id: string) => {
  const result = await SampleModel.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Sample not found");
  }
  return result;
};

export const SampleServices = {
  createSample,
  getAllSamples,
  getSampleById,
  updateSample,
  deleteSample,
};
