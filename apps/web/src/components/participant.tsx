import { Avatar, AvatarFallback, AvatarImage } from "@rallly/ui/avatar";

export function Participant({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-x-2">{children}</div>;
}

export const ParticipantAvatar = ({
  src,
  name,
}: {
  src?: string;
  name: string;
}) => {
  return (
    <Avatar>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback>{name[0]}</AvatarFallback>
    </Avatar>
  );
};

export const ParticipantName = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="text-sm font-medium">{children}</div>;
};
