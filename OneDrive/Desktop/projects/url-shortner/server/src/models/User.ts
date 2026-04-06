import mongoose, { Document, Schema} from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
    email: string;
    password: string;
    name: string;
    refreshToken?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
    comparePassword(candidatePassword: string) : Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        refreshToken: {
            type: String,
            default: null
        },
    },
    { timestamps: true}
);

userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (
    candidatePassword: string
) : Promise<boolean>{
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>("User", userSchema);
