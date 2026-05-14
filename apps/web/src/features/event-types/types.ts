import type { Location } from "@/lib/location";

export type EventTypeHost = {
  id: string;
  name: string;
  image: string | null;
};

export type EventTypeDTO = {
  id: string;
  name: string;
  duration: number;
  capacity: number | null;
  description: string | null;
  location: Location | null;
  hostId: string;
  host: EventTypeHost;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
};
