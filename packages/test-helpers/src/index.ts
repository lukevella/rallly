export { getCode, getPasswordResetLink, getSpaceInviteLink } from "./email";
export { loginWithEmail } from "./login";
export {
  captureEmailHTML,
  captureOne,
  deleteAllMessages,
  getAttachmentText,
  getMessage,
  getMessageHeaders,
  getMessages,
  type MailpitAttachment,
  type MailpitEmailAddress,
  type MailpitListMessagesResponse,
  type MailpitMessage,
  type MailpitMessageSummary,
} from "./mailpit";
