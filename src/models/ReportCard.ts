import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IReportCardSubject {
  subject: string;
  classWork: number;
  examScore: number;
  total: number;
  grade: string;
  remark: string;
}

export interface IReportCardBehaviourRating {
  key: string;
  label: string;
  rating: string;
}

export interface IReportCard {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  studentDmsNumber?: string;
  gender?: string;
  className: string;
  term: string;
  sessionLabel: string;
  attendanceDays?: number;
  nextTermBegins?: string;
  resumptionDate?: string;
  teacherName?: string;
  subjects: IReportCardSubject[];
  average: number;
  behaviourRatings: IReportCardBehaviourRating[];
  teacherComment?: string;
  principalComment?: string;
  teacherSignature?: string;
  principalSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportCardSubjectSchema = new Schema<IReportCardSubject>(
  {
    subject: { type: String, required: true },
    classWork: { type: Number, required: true, default: 0 },
    examScore: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    grade: { type: String, required: true, default: "F" },
    remark: { type: String, required: true, default: "Fail" },
  },
  { _id: false },
);

const ReportCardBehaviourRatingSchema = new Schema<IReportCardBehaviourRating>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    rating: { type: String, required: true, default: "" },
  },
  { _id: false },
);

const ReportCardSchema = new Schema<IReportCard>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true },
    studentDmsNumber: { type: String },
    gender: { type: String },
    className: { type: String, required: true },
    term: { type: String, required: true },
    sessionLabel: { type: String, required: true },
    attendanceDays: { type: Number },
    nextTermBegins: { type: String },
    resumptionDate: { type: String },
    teacherName: { type: String },
    subjects: {
      type: [ReportCardSubjectSchema],
      default: [],
    },
    average: { type: Number, required: true, default: 0 },
    behaviourRatings: {
      type: [ReportCardBehaviourRatingSchema],
      default: [],
    },
    teacherComment: { type: String },
    principalComment: { type: String },
    teacherSignature: { type: String },
    principalSignature: { type: String },
  },
  {
    timestamps: true,
  },
);

ReportCardSchema.index(
  { studentId: 1, className: 1, term: 1, sessionLabel: 1 },
  { unique: true },
);

export const ReportCard: Model<IReportCard> =
  models.ReportCard || model<IReportCard>("ReportCard", ReportCardSchema);
