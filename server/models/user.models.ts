import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------
// TypeScript User Interface
// ---------------------------
export interface IUser extends Document {
  _id: String,
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: mongoose.Types.ObjectId }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string,
  SignRefreshToken: () => string
}

// ---------------------------
// User Schema
// ---------------------------
const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: {
        validator: (value: string) => emailRegex.test(value),
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      minlength: [4, "Password should be at least 6 characters"],
      select: false
    },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" }
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ---------------------------
// Password Hashing Middleware
// ---------------------------
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ---------------------------
// Sign Access token
// ---------------------------
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "20m"
  })
}


// ---------------------------
// Sign Refresh token
// ---------------------------
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d"
  })
}
// ---------------------------------------------------------------------------------------------- 2:51

// ---------------------------
// Compare Password Method
// ---------------------------
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// ---------------------------
// Export Model
// ---------------------------
const UserModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default UserModel;
