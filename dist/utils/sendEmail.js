"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail(to, html) {
    let testAccount = await nodemailer_1.default.createTestAccount();
    console.log(testAccount);
    let transporter = nodemailer_1.default.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: "xgqkcqe4nln6ict5@ethereal.email",
            pass: "kq2BqkBAr4S2Pw5SVT",
        },
    });
    let info = await transporter.sendMail({
        from: '"Reddit Clone 👻" <foo@example.com>',
        to: to,
        subject: "Change password",
        html: html,
    });
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
}
exports.sendEmail = sendEmail;
//# sourceMappingURL=sendEmail.js.map