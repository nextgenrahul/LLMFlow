import express from 'express';
import { registerUser, activeUser, loginUser, logoutUser, updateAccessToken, getUserInfo, socialAuth, updateUserInfo, updatePassword, updateProfilePicture, getAllUsers } from '../controllers/user.controller';
import { isAuthenticated, authorizeRoles } from '../middlewares/auth';

const userRouter = express.Router();

// Register new user
userRouter.post('/registration', registerUser);

// Activate user
userRouter.post('/active-user', activeUser);

// Login user
userRouter.post('/login-user', loginUser);

// Logout user (protected)
userRouter.get('/logout-user', isAuthenticated, authorizeRoles("admin", "user"), logoutUser);

userRouter.get('/refreshtoken', updateAccessToken);

userRouter.get('/me', isAuthenticated, getUserInfo);

userRouter.post("/social-auth", socialAuth);

userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);

userRouter.put("/update-user-password", isAuthenticated, updatePassword);

userRouter.put("/update-user-avatar", isAuthenticated, updateProfilePicture);

userRouter.get("/get-users", isAuthenticated, authorizeRoles("admin"), getAllUsers);





export default userRouter;
