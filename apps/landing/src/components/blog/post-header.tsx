import DateFormatter from "./date-formatter";

type Props = {
  title: string;
  date: string;
};

const PostHeader = ({ title, date }: Props) => {
  return (
    <header>
      <h1 className="text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-4xl">
        {title}
      </h1>
      <div className="mt-2 text-gray-500">
        <DateFormatter dateString={date} />
      </div>
    </header>
  );
};

export default PostHeader;
