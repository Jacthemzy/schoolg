import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAnswerRecord {
  questionId: Types.ObjectId;
  selectedOption?: number;
  answerText?: string;
  isCorrect: boolean;
  scoreAwarded: number;
  matchedKeywords: string[];
  expectedKeywords: string[];
}

export type ResultStatus = "in_progress" | "submitted";

export interface IResult {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  examId: Types.ObjectId;
  score: number;
  totalMarks: number;
  answers: IAnswerRecord[];
  status: ResultStatus;
  readingEndsAt?: Date;
  examEndsAt?: Date;
  currentQuestionNumber?: number;
  submittedAt?: Date;
  createdAt: Date;
}

const AnswerSchema = new Schema<IAnswerRecord>({
  questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  selectedOption: { type: Number },
  answerText: { type: String },
  isCorrect: { type: Boolean, required: true },
  scoreAwarded: { type: Number, required: true, default: 0 },
  matchedKeywords: { type: [String], default: [] },
  expectedKeywords: { type: [String], default: [] },
});

const ResultSchema = new Schema<IResult>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  answers: [AnswerSchema],
  status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
  readingEndsAt: { type: Date },
  examEndsAt: { type: Date },
  currentQuestionNumber: { type: Number, default: 1 },
  submittedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

ResultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

export const Result: Model<IResult> =
  models.Result || model<IResult>("Result", ResultSchema);

