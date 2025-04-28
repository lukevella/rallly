import markdownStyles from "./markdown-styles.module.css";

type Props = {
  content: string;
};

const PostBody = ({ content }: Props) => {
  return (
    <div
      className={markdownStyles.markdown}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Fix this later
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default PostBody;
