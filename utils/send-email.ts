import nodemailer from "nodemailer";
import sgTransport from "nodemailer-sendgrid-transport";

interface SendEmailParameters {
  to: string;
  subject: string;
  html: string;
}

const getTransport = async () => {
  if (process.env.SENDGRID_API_KEY) {
    const sgTransportParams = sgTransport({
      auth: { api_key: process.env.SENDGRID_API_KEY },
    });
    return nodemailer.createTransport(sgTransportParams);
  } else {
    const auth = await nodemailer.createTestAccount();

    console.log(
      `Email sent using ethereal.email account:\n${auth.user}\n${auth.pass}`,
    );

    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      // In development we use https://ethereal.email
      auth,
    });
  }
};

export const sendEmail = async (params: SendEmailParameters) => {
  const transport = await getTransport();
  return await transport.sendMail({
    to: params.to,
    from: `Rallly ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`,
    subject: params.subject,
    html: params.html,
  });
};
