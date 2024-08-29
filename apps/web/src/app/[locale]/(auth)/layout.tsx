import { TermiteAlert } from "@/app/[locale]/(admin)/termite-alert";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full p-3 sm:p-8">
      <div className="mx-auto max-w-4xl mb-10">
        <TermiteAlert />
      </div>
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}
