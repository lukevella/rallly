import { previewEmailContext } from "../components/email-context";
import { NewCommentEmail } from "../templates/new-comment";

function NewCommentEmailPreview() {
  return (
    <NewCommentEmail
      title="Untitled Poll"
      authorName="Someone"
      pollUrl="https://rallly.co"
      disableNotificationsUrl="https://rallly.co"
      ctx={previewEmailContext}
    />
  );
}

export default NewCommentEmailPreview;
