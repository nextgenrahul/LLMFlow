import express from 'express';
import { registerUser, activeUser, loginUser, logoutUser, updateAccessToken, getUserInfo, socialAuth, updateUserInfo } from '../controllers/user.controller';
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

userRouter.post("/update-user",isAuthenticated, updateUserInfo);


export default userRouter;
