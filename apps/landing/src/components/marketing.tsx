import { ArrowUpRight } from "@rallly/icons";
import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { NextSeo } from "next-seo";
import React from "react";

import Bonus from "@/components/home/bonus";
import { Trans } from "@/components/trans";

// const UsedBy = () => {
//   return (
//     <div>
//       <h2 className="mx-auto mb-8 max-w-2xl text-center leading-relaxed">
//         Used by employees of some of the world's most influential companies and
//         organizations
//       </h2>
//       <div className="flex flex-wrap justify-center gap-8">
//         <div className="relative h-12 w-24 grayscale hover:grayscale-0">
//           <Image
//             src="/icrc-logo.svg"
//             fill
//             style={{ objectFit: "contain" }}
//             alt="ICRC"
//           />
//         </div>
//         <div className="relative h-12 w-24 grayscale hover:grayscale-0">
//           <Image
//             src="/harvard-logo.svg"
//             fill
//             style={{ objectFit: "contain" }}
//             alt="Hardvard University"
//           />
//         </div>
//         <div className="relative h-10 w-20 grayscale hover:grayscale-0">
//           <Image
//             src="/nhs-logo.svg"
//             fill
//             style={{ objectFit: "contain" }}
//             alt="NHS"
//           />
//         </div>
//         <div className="relative h-10 w-20 grayscale hover:grayscale-0">
//           <Image
//             src="/bcg-logo.svg"
//             fill
//             style={{ objectFit: "contain" }}
//             alt="Boston Consulting Group"
//           />
//         </div>
//         <div className="relative h-10 w-20 grayscale hover:grayscale-0">
//           <Image
//             src="/deloitte-logo.svg"
//             fill
//             style={{ objectFit: "contain" }}
//             alt="Deloitte"
//           />
//         </div>
//         <div className="relative h-10 w-20 grayscale hover:grayscale-0">
//           <Image
//             src="/ieee-logo.svg"
//             fill
//             style={{ objectFit: "contain" }}
//             alt="IEEE"
//           />
//         </div>
//         <div className="relative h-10 w-20 grayscale hover:grayscale-0">
//           <Image
//             src="/nasa-logo.svg"
//             fill
//             style={{ objectFit: "contain" }}
//             alt="NASA"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// const Testimonials = () => {
//   return (
//     <div>
//       <h2 className="mb-12 text-center">Testimonials</h2>
//       <div className="">
//         {/* <Testimonial author="Dan">
//           {`Rallly is the only service that meets all my needs and is 100%
//         free. It's incredibly easy to use, no sign-in even required. And I
//         trust rallly.co because the entire project is open source.`}
//         </Testimonial>
//         <Testimonial author="Robert">
//           I was looking for something simple and clean (without tons of ads)
//           that would be easy for me to administer and easy for others to use.
//           This fit the bill perfectly.
//         </Testimonial>
//         <Testimonial author="Adrià">
//           Awesome Doodle alternative. I love its open-source nature, and how
//           easy it is to use thanks to its modern and clean UI.
//         </Testimonial> */}
//       </div>
//       {/* <div className="mt-8 text-center">
//         <Button className="rounded-full px-6" asChild>
//           <Link
//             target="_blank"
//             href="https://www.trustpilot.com/evaluate/rallly.co"
//           >
//             <span>Share your experience</span>
//             <ArrowRight className="h-4 w-4" />
//           </Link>
//         </Button>
//       </div> */}
//     </div>
//   );
// };

// const Testimonial = ({
//   author,
//   children,
//   logo,
// }: React.PropsWithChildren<{ author: string; logo?: string }>) => {
//   return (
//     <div className="relative flex flex-col space-y-4 rounded-md bg-gray-50 px-4 py-3 shadow-sm">
//       <QuoteIcon className="h-4 w-4 text-gray-400" />
//       <div className="flex justify-between">
//         <div className="flex flex-col gap-2">
//           <div className="font-semibold">{author}</div>
//           <Image
//             src="/static/images/stars-5.svg"
//             width={100}
//             height={30}
//             alt="5 stars"
//           />
//         </div>
//         {logo ? (
//           <div className="relative h-16 w-16">
//             <Image src={logo} fill alt="logo" />
//           </div>
//         ) : null}
//       </div>
//       <p className="grow text-sm leading-relaxed">{children}</p>
//       <div className="relative h-8 w-24">
//         <Image
//           src="/trustpilot-logo.svg"
//           fill
//           alt="TrustPilot"
//           style={{ objectPosition: "left", objectFit: "contain" }}
//         />
//       </div>
//     </div>
//   );
// };

const Mention = ({
  logo,
  children,
  delay = 0,
}: React.PropsWithChildren<{
  logo: React.ReactNode;
  delay?: number;
}>) => {
  return (
    <m.div
      transition={{
        delay,
        type: "spring",
        bounce: 0.3,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center space-y-4 rounded-md"
    >
      <div className="flex items-start justify-between">{logo}</div>
      <p className="grow text-center text-base">{children}</p>
    </m.div>
  );
};

const MentionedBy = () => {
  return (
    <div>
      <div className="grid gap-8 md:grid-cols-4">
        <Mention
          delay={0.25}
          logo={
            <div className="relative h-8 w-14">
              <Image
                src="/static/images/pcmag-logo.svg"
                alt="PCMag"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          }
        >
          <Trans
            i18nKey="home:pcmagQuote"
            defaults="“Set up a scheduling poll in as little time as possible.”"
          />
        </Mention>
        <Mention
          delay={0.5}
          logo={
            <div className="relative h-8 w-24">
              <Image
                src="/static/images/hubspot-logo.svg"
                alt="HubSpot"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          }
        >
          <Trans
            i18nKey="home:hubspotQuote"
            defaults="“The simplest choice for availability polling for large groups.”"
          />
        </Mention>
        <Mention
          delay={0.75}
          logo={
            <div className="relative h-8 w-32">
              <Image
                src="/static/images/goodfirms-logo.svg"
                alt="Goodfirms"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          }
        >
          <Trans
            i18nKey="home:goodfirmsQuote"
            defaults="“Unique in its simplicity and requires minimum interaction time.”"
          />
        </Mention>
        <Mention
          delay={1}
          logo={
            <div className="relative h-8 w-20">
              <Image
                src="/static/images/popsci-logo.svg"
                alt="PopSci"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          }
        >
          <Trans
            i18nKey="home:popsciQuote"
            defaults="“The perfect pick if you want to keep your RSVPs simple.”"
          />
        </Mention>
      </div>
    </div>
  );
};

const BigTestimonial = () => {
  return (
    <m.div
      transition={{
        duration: 1,
        type: "spring",
        bounce: 0.3,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "all" }}
      className="flex flex-col items-center gap-y-8 "
    >
      <Image
        src="/static/images/stars-5.svg"
        width={120}
        height={30}
        alt="5 stars"
      />
      <div className="text-center">
        <p className="max-w-xl text-center text-lg font-medium leading-normal">
          <Trans
            i18nKey="home:ericQuote"
            defaults="“If your scheduling workflow lives in emails, I strongly encourage you to try and let Rallly simplify your scheduling tasks for a more organized and less stressful workday.”"
          />
        </p>
        <p className="mt-1">
          <Link
            target="_blank"
            className="text-sm text-gray-500 hover:underline"
            href="https://www.trustpilot.com/reviews/645e1d1976733924e89d8203"
          >
            <Trans i18nKey="home:viaTrustpilot" defaults="via Trustpilot" />
            <ArrowUpRight className="ml-1 inline h-3 w-3" />
          </Link>
        </p>
      </div>
      <div className="flex gap-x-4">
        <Image
          className="rounded-full"
          src="/static/images/eric.png"
          width={48}
          height={48}
          alt="Eric Fletcher"
        />
        <div>
          <div className="font-semibold">Eric Fletcher</div>
          <div className="text-sm text-gray-500">
            <Trans
              i18nKey="home:ericJobTitle"
              defaults="Executive Assistant at MIT"
            />
          </div>
        </div>
      </div>
    </m.div>
  );
};

export const Marketing = ({
  children,
  ...props
}: React.PropsWithChildren<{ title: string; description: string }>) => {
  return (
    <div className="space-y-12 sm:space-y-24">
      <NextSeo {...props} />
      {children}
      <Bonus />
      <BigTestimonial />
      <MentionedBy />
    </div>
  );
};
