import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IQuestion {
  _id: Types.ObjectId;
  examId: Types.ObjectId;
  questionType: "text" | "image";
  answerType: "objective" | "theory";
  questionText: string;
  questionImageUrl?: string;
  options: string[];
  correctAnswer?: number;
  theoryKeywords: string[];
  theorySampleAnswer?: string;
  marks: number;
  questionNumber: number;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  questionType: { type: String, enum: ["text", "image"], default: "text" },
  answerType: {
    type: String,
    enum: ["objective", "theory"],
    default: "objective",
  },
  questionText: {
    type: String,
    default: "",
    validate: {
      validator(value: string) {
        const question = this as IQuestion;
        return Boolean(String(value ?? "").trim() || question.questionImageUrl);
      },
      message: "Question text or image is required.",
    },
  },
  questionImageUrl: { type: String },
  options: {
    type: [{ type: String, required: true }],
    default: [],
    validate: {
      validator(value: string[]) {
        const question = this as IQuestion;
        return question.answerType === "theory" || value.length >= 2;
      },
      message: "Objective questions need at least two options.",
    },
  },
  correctAnswer: {
    type: Number,
    validate: {
      validator(value?: number) {
        const question = this as IQuestion;
        if (question.answerType === "theory") {
          return value === undefined || value === null;
        }

        if (value === undefined || value === null) {
          return false;
        }

        return Number.isInteger(value) && value >= 0 && value < question.options.length;
      },
      message: "Objective questions need a valid correct answer.",
    },
  },
  theoryKeywords: {
    type: [{ type: String, required: true }],
    default: [],
    validate: {
      validator(value: string[]) {
        const question = this as IQuestion;
        return question.answerType === "objective" || value.length > 0;
      },
      message: "Theory questions need at least one keyword.",
    },
  },
  theorySampleAnswer: { type: String },
  marks: { type: Number, required: true },
  questionNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Question: Model<IQuestion> =
  models.Question || model<IQuestion>("Question", QuestionSchema);

