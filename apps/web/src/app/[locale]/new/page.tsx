import { BackButton } from "@/app/[locale]/(admin)/menu/menu-button";
import { getTranslation } from "@/app/i18n";
import { CreatePoll } from "@/components/create-poll";
import { UserDropdown } from "@/components/user-dropdown";

export default async function Page() {
  return (
    <div>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-gray-100/90 p-3 backdrop-blur-md sm:grid-cols-3">
        <div className="justify-center sm:flex">
          <BackButton />
        </div>
        <div className="flex justify-end">
          <UserDropdown />
        </div>
      </div>
      <div className="mx-auto max-w-4xl p-3 sm:px-6 sm:py-5">
        <CreatePoll />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("newPoll"),
  };
}
