export const SettingsSection = (props: {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div className="sm-p-6 grid max-w-7xl grid-cols-1 gap-x-8 gap-y-8 p-4 md:grid-cols-3 lg:p-8">
      <div>
        <h2 className="text-base">{props.title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          {props.description}
        </p>
      </div>
      <div className="md:col-span-2">{props.children}</div>
    </div>
  );
};
