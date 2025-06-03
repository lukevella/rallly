import DateFormatter from "./date-formatter";

type Props = {
  title: string;
  date: string;
};

const PostHeader = ({ title, date }: Props) => {
  return (
    <header>
      <h1 className="mb-2 text-center font-bold text-4xl tracking-tighter md:text-left md:leading-tight">
        {title}
      </h1>
      <div className="mb-2 text-center text-gray-400 text-lg sm:text-left">
        <DateFormatter dateString={date} />
      </div>
    </header>
  );
};

export default PostHeader;
