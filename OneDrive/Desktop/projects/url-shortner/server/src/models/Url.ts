import mongoose, { Document, Schema, StringQueryTypeCasting} from "mongoose";
import { isStringObject } from "node:util/types";

export interface IUrl {
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  clicks: number;
  owner: mongoose.Types.ObjectId;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updated?: Date;
}

export interface IUrlDocument extends IUrl, Document {}

const urlSchema = new Schema <IUrlDocument>(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customAlias: {
      type: String,
      unique: true,
      //allows to have multiple null with out conficlts
      sparse: true,
      trim: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);



urlSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, sparse: true }
);

export const Url = mongoose.model<IUrlDocument>("Url", urlSchema);