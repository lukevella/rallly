import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);

type Props = {
  dateString: string;
};

const DateFormatter = ({ dateString }: Props) => {
  return <time dateTime={dateString}>{dayjs(dateString).format("LL")}</time>;
};

export default DateFormatter;
