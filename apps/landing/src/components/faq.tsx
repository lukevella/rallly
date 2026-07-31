import { PlusIcon } from "lucide-react";

export function Faq({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: { question: string; answer: string }[];
}) {
  return (
    <section aria-label={title} className="mx-auto w-full max-w-4xl">
      <p className="font-semibold text-primary text-sm uppercase tracking-widest">
        {eyebrow}
      </p>
      <h2 className="mt-4 max-w-[22ch] text-balance font-bold text-3xl tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-xl text-pretty text-gray-500 sm:text-lg">
        {description}
      </p>
      <div className="mt-12 divide-y border-y">
        {items.map((item) => (
          <details key={item.question} className="group py-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-x-4 font-semibold sm:text-lg [&::-webkit-details-marker]:hidden">
              {item.question}
              <PlusIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-primary transition-transform group-open:rotate-45"
              />
            </summary>
            <p className="mt-4 max-w-3xl text-gray-500 leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
