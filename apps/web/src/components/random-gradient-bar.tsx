import { generateGradient } from "@/utils/color-hash";

export function RandomGradientBar({ seed }: { seed?: string }) {
  return (
    <div
      className="-mx-px -mt-px h-2 rounded-t-md"
      style={{ background: generateGradient(seed ?? "") }}
    />
  );
}
