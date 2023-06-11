import Head from "next/head";
import { useTranslation } from "next-i18next";

import { CreatePoll } from "@/components/create-poll";
import { getStandardLayout } from "@/components/layouts/standard-layout";

import { NextPageWithLayout } from "../types";
import { getStaticTranslations } from "../utils/with-page-translations";

// const eventDetilsFormSchema = z.object({
//   title: z.string(),
//   description: z.string(),
//   location: z.string(),
// });

// type EventDetailsFormData = z.infer<typeof eventDetilsFormSchema>;

// const EventDetailsForm = () => {
//   const form = useForm<EventDetailsFormData>();
//   return (
//     <Form {...form}>
//       <form className="mx-auto max-w-2xl">
//         <div className="mb-8 text-center">
//           <h2 className="">
//             <Trans i18nKey="eventDetails" defaults="Event Details" />
//           </h2>
//           <p className="leading-6 text-gray-500">
//             <Trans
//               i18nKey="eventDetailsDescription"
//               defaults="What are you organzing?"
//             />
//           </p>
//         </div>
//         <div className="space-y-4">
//           <FormField
//             control={form.control}
//             name="title"
//             render={() => (
//               <FormItem>
//                 <FormLabel id="test">
//                   <Trans defaults="Title" i18nKey="title" />
//                 </FormLabel>

//                 <Input placeholder="Enter a title for your event" />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="description"
//             render={() => (
//               <FormItem>
//                 <FormLabel id="test">
//                   <Trans defaults="Description" i18nKey="description" />
//                 </FormLabel>

//                 <Textarea placeholder="Enter a location for your event" />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="location"
//             render={() => (
//               <FormItem>
//                 <FormLabel id="test">
//                   <Trans defaults="Location" i18nKey="location" />
//                 </FormLabel>

//                 <Input placeholder="Enter a location for your event" />
//               </FormItem>
//             )}
//           />
//         </div>
//         <div className="mt-6 flex">
//           <Button type="primary" htmlType="submit">
//             <Trans i18nKey="continue" />
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// };

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>{t("newPoll")}</title>
      </Head>
      <CreatePoll />
    </>
  );
};

Page.getLayout = getStandardLayout;

export default Page;

export const getStaticProps = getStaticTranslations;
