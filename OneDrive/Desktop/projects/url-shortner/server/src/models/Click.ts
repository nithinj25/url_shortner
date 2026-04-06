import mongoose, { Document, Schema } from "mongoose";

// 📚 LEARN: Every single click on a short URL gets its own document
// This is called an "event log" pattern — you never update, only insert
// This makes it easy to query "all clicks this week" or "clicks by country"
export interface IClick {
  urlId: mongoose.Types.ObjectId;   // which short URL was clicked
  owner: mongoose.Types.ObjectId;   // who owns that URL (for fast filtering)
  ip?: string;                      // raw IP address of the visitor
  country?: string;                 // e.g. "India"
  city?: string;                    // e.g. "Bengaluru"
  device?: string;                  // "mobile" | "desktop" | "tablet"
  browser?: string;                 // "Chrome" | "Firefox" | "Safari"
  os?: string;                      // "Windows" | "macOS" | "Android" | "iOS"
  referrer?: string | null;                // where did they come from?
  createdAt?: Date;
}

export interface IClickDocument extends IClick, Document {}

const clickSchema = new Schema<IClickDocument>(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Url",
      required: true,
      // 📚 LEARN: index:true speeds up queries like
      // "give me all clicks for URL xyz" — MongoDB won't
      // scan every document, it uses this index directly
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ip:       { type: String, default: null },
    country:  { type: String, default: null },
    city:     { type: String, default: null },
    device:   { type: String, default: null },
    browser:  { type: String, default: null },
    os:       { type: String, default: null },
    referrer: { type: String, default: null },
  },
  {
    timestamps: true, // createdAt = the exact moment of the click
  }
);

export const Click = mongoose.model<IClickDocument>("Click", clickSchema);