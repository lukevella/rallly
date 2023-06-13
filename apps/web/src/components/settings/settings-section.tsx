export const SettingsSection = (props: {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-8 p-3 sm:p-6 md:grid-cols-3">
      <div>
        <h2 className="text-base font-semibold">{props.title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          {props.description}
        </p>
      </div>
      <div className="md:col-span-2">{props.children}</div>
    </div>
  );
};
