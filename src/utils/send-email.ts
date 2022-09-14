import nodemailer from "nodemailer";

interface SendEmailParameters {
  to: string;
  subject: string;
  html: string;
}

let transport: nodemailer.Transporter;

const getTransport = async () => {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PWD,
      },
    });
  }
  return transport;
};

export const sendEmail = async (params: SendEmailParameters) => {
  const transport = await getTransport();
  try {
    await transport.verify();
    return await transport.sendMail({
      to: params.to,
      from: `Rallly ${process.env.SUPPORT_EMAIL}`,
      subject: params.subject,
      html: params.html,
    });
  } catch (e) {
    console.error(e);
  }
};
