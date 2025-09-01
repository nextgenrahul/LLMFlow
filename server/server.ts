import { app } from "./app";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./utils/database";




connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}).catch((err) => {
  console.error("Database connection failed, server not started:", err);
});
