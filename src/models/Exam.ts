import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IExam {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  subject: string;
  classTarget: string;
  readingTime: number;
  duration: number;
  totalMarks: number;
  examPassword: string;
  isActive: boolean;
  createdAt: Date;
}

const ExamSchema = new Schema<IExam>({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  classTarget: { type: String, required: true },
  readingTime: { type: Number, required: true },
  duration: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  examPassword: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Exam: Model<IExam> =
  models.Exam || model<IExam>("Exam", ExamSchema);

