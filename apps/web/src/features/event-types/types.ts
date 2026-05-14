import type { Location } from "@/lib/location";

export type EventTypeDTO = {
  id: string;
  name: string;
  duration: number;
  capacity: number | null;
  description: string | null;
  location: Location | null;
  hostId: string;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
};
