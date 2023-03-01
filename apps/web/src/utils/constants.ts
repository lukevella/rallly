import { Placement } from "@floating-ui/react-dom-interactions";

export const isInMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

export const transformOriginByPlacement: Record<Placement, string> = {
  bottom: "origin-top",
  "bottom-end": "origin-top-right",
  "bottom-start": "origin-top-left",
  left: "origin-right",
  "left-start": "origin-top-right",
  "left-end": "origin-bottom-right",
  right: "origin-left",
  "right-start": "origin-top-left",
  "right-end": "origin-bottom-left",
  top: "origin-bottom",
  "top-start": "origin-bottom-left",
  "top-end": "origin-bottom-right",
};
