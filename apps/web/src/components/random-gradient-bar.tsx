import { generateGradient } from "@/utils/color-hash";

export function RandomGradientBar({ seed }: { seed?: string }) {
  return (
    <div
      className="-mx-px -mt-px h-2 sm:rounded-t-md"
      style={{ background: generateGradient(seed ?? "") }}
    />
  );
}
