import { FinalizeHostEmail } from "./templates/finalized-host";
import { FinalizeParticipantEmail } from "./templates/finalized-participant";
import { LoginEmail } from "./templates/login";
import { NewCommentEmail } from "./templates/new-comment";
import { NewParticipantEmail } from "./templates/new-participant";
import { NewParticipantConfirmationEmail } from "./templates/new-participant-confirmation";
import { NewPollEmail } from "./templates/new-poll";
import { RegisterEmail } from "./templates/register";
import type { TemplateName } from "./types";

const templates = {
  FinalizeHostEmail,
  FinalizeParticipantEmail,
  LoginEmail,
  NewCommentEmail,
  NewParticipantEmail,
  NewParticipantConfirmationEmail,
  NewPollEmail,
  RegisterEmail,
};

export const emailTemplates = Object.keys(templates) as TemplateName[];

export type EmailTemplates = typeof templates;

export { templates };
