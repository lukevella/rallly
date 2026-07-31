export function Faq({
  title,
  items,
}: {
  title: string;
  items: { question: string; answer: string }[];
}) {
  return (
    <section aria-label={title} className="mx-auto w-full max-w-3xl">
      <h2 className="text-center font-bold text-2xl tracking-tight">{title}</h2>
      <div className="mt-8 space-y-8">
        {items.map((item) => (
          <div key={item.question}>
            <h3 className="font-semibold text-lg">{item.question}</h3>
            <p className="mt-2 text-gray-500 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
