import mongoose from "mongoose";
import { ISample } from "./sample.interface";

const sampleSchema = new mongoose.Schema<ISample>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

const SampleModel = mongoose.model<ISample>("Sample", sampleSchema);
export default SampleModel;
