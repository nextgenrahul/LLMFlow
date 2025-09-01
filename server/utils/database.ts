import mongoose from "mongoose";

let isConnected = false; 

const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.DB_URL!, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);
    setTimeout(connectDB, 5000);
  }
}; 

export default connectDB;
 