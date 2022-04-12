declare module "nodemailer-sendgrid-transport" {
  function sgTransport(options: { auth: { api_key: string } }): SMTPTransport;
  export default sgTransport;
}
