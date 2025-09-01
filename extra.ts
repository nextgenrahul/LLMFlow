// // ---------------------------
// export const registerUser = CatchAsyncError(
//     async (req: Request<{}, {}, IRegisterUser>, res: Response, next: NextFunction) => {
//         try {


//             const { name, email, password, avatar } = req.body;
//             console.log(name,email, password)

//             const existingUser = await UserModel.findOne({ email });
//             if (existingUser) {
//                 return next(new ErrorHandler("User already exists", 400));
//             }

//             const newUser = await UserModel.create({
//                 name,
//                 email,
//                 password,
//                 avatar,
//             });

//             const activationToken = createActivationToken({ _id: newUser._id.toString() } as IUserMinimal);
            
//             const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), {
//                 name: newUser.name,
//                 activationCode: activationToken.activationCode,
//             }); 

//             try {
//                 // await sendMail({
//                 //     email: newUser.email,
//                 //     subject: "Account Activation",
//                 //     template: "activation-mail.ejs",
//                 //     data: {
//                 //         name: newUser.name,
//                 //         activationCode: activationToken.activationCode,
//                 //     }
//                 // });
//                 // Send response
//                 // res.status(201).json({
//                 //     success: true,
//                 //     message: `Please Check your ${newUser.email} to activate your account.`,
//                 //     activationToken: activationToken.token,
//                 // });

                
//             } catch (error) {
//                 console.error("Error sending activation email:", error);
//                 return next(new ErrorHandler("Failed to send activation email", 500));
//             }

//         } catch (error) {
//             console.error("Error registering user:", error);
//             return next(new ErrorHandler("Failed to register user", 500));
//         }
//     }
// );
