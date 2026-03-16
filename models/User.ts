import { Schema, model, models, type Model } from "mongoose";

export type UserRole = "admin" | "student";

export interface IUser {
  dmsNumber?: string;
  email?: string;
  fullName: string;
  className?: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  dmsNumber: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  fullName: { type: String, required: true },
  className: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "student"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User: Model<IUser> =
  models.User || model<IUser>("User", UserSchema);

