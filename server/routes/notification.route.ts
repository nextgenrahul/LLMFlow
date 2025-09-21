import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { getNotificaton, updateNotification } from "../controllers/notification.controller";

const notificationRouter = express.Router();

notificationRouter.get("/get-all-notification", isAuthenticated, authorizeRoles("admin"), getNotificaton);
notificationRouter.put("/update-notification/:id", isAuthenticated, authorizeRoles("admin"), updateNotification);

export default notificationRouter;
