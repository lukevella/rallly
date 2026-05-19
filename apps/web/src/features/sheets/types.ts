import type { Location } from "@/lib/location";

export interface SheetDTO {
  id: string;
  title: string;
  description: string | null;
  urlId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SheetSlotDTO {
  id: string;
  startTime: Date;
  eventType: {
    id: string;
    name: string;
    duration: number;
    description: string | null;
    location: Location | null;
    capacity: number | null;
  };
  bookingCount: number;
  capacity: number | null;
}

export interface SheetDetailDTO extends SheetDTO {
  slots: SheetSlotDTO[];
}
