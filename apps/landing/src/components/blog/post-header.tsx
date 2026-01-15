import DateFormatter from "./date-formatter";

type Props = {
  title: string;
  date: string;
};

const PostHeader = ({ title, date }: Props) => {
  return (
    <header>
      <h1 className="mb-2 font-bold text-2xl tracking-tighter sm:text-4xl">
        {title}
      </h1>
      <div className="mb-2 text-gray-400 text-lg">
        <DateFormatter dateString={date} />
      </div>
    </header>
  );
};

export default PostHeader;
