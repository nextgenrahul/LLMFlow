import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
  preview?: boolean; // 👈 new flag
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  const { email, subject, template, data, preview } = options;

  

//   const templatePath = path.join(__dirname, "../mails", template);
//   const html: string = await ejs.renderFile(templatePath, data);

//   if (preview) {
//     // Just log HTML (or save to file, or send to res)
//     console.log("📄 Preview HTML:\n", html);
//     return;
//   }

//   const transporter: Transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT || "587"),
//     secure: false,
//     auth: {
//       user: process.env.BREVO_USER,
//       pass: process.env.BREVO_SMTP_KEY,
//     },
//   });

//   const mailOptions = {
//     from: process.env.SMTP_MAIL,
//     to: email,
//     subject,
//     html,
//   };

//   await transporter.sendMail(mailOptions);
};


export default sendMail;
