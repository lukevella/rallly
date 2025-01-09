export interface MailpitAttachment {
  ContentID: string;
  ContentType: string;
  FileName: string;
  PartID: string;
  Size: number;
}

export interface MailpitEmailAddress {
  Address: string;
  Name: string;
}

export interface MailpitMessageSummary {
  Attachments: number;
  Bcc: MailpitEmailAddress[];
  Cc: MailpitEmailAddress[];
  Created: string;
  From: MailpitEmailAddress;
  ID: string;
  MessageID: string;
  Read: boolean;
  ReplyTo: MailpitEmailAddress[];
  Size: number;
  Snippet: string;
  Subject: string;
  Tags: string[];
  To: MailpitEmailAddress[];
}

export interface MailpitMessage extends MailpitMessageSummary {
  HTML: string;
  Text: string;
  Inline: MailpitAttachment[];
  ReturnPath: string;
  Date: string;
}

export interface MailpitListMessagesResponse {
  messages: MailpitMessageSummary[];
  messages_count: number;
  start: number;
  tags: string[];
  total: number;
  unread: number;
}
