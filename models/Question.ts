import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IQuestion {
  _id: Types.ObjectId;
  examId: Types.ObjectId;
  questionText: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  questionNumber: number;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  marks: { type: Number, required: true },
  questionNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Question: Model<IQuestion> =
  models.Question || model<IQuestion>("Question", QuestionSchema);

