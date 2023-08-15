import DateFormatter from "@/components/blog/date-formatter";

type Props = {
  title: string;
  date: string;
};

const PostHeader = ({ title, date }: Props) => {
  return (
    <>
      <h1 className="mb-2 text-center text-4xl font-bold tracking-tighter md:text-left md:leading-tight">
        {title}
      </h1>
      <div className="mb-2 text-center text-lg text-gray-400 sm:text-left">
        <DateFormatter dateString={date} />
      </div>
    </>
  );
};

export default PostHeader;
