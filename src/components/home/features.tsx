import * as React from "react";

import Bell from "@/components/icons/bell.svg";
import Chat from "@/components/icons/chat.svg";
import Clock from "@/components/icons/clock.svg";
import DeviceMobile from "@/components/icons/device-mobile.svg";

const Features: React.VoidFunctionComponent = () => {
  return (
    <div className="mx-auto max-w-7xl py-16 px-8">
      <h2 className="heading">Features</h2>
      <p className="subheading">Everything you need to get the job done</p>
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-green-100/50 p-3 text-green-400">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="heading-sm flex items-center">
            Time slots
            <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-sm font-normal text-white">
              New
            </span>
          </h3>
          <p className="text">
            If you need more granular options, Rallly lets you choose time slots
            as options. If your participants are international, they can see
            times in their own time zone.
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-cyan-100/50 p-3 text-cyan-400">
            <DeviceMobile className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">Mobile friendly design</h3>
          <p className="text">
            Rallly is optimized to look and work great on mobile devices so you
            and your participants can use it on the go.
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-rose-100/50 p-3 text-rose-400">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">Notifications</h3>
          <p className="text">
            Need help staying on top of things? Rallly can send you an email
            whenever participants vote or comment on your poll.
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="mb-4 inline-block rounded-2xl bg-yellow-100/50 p-3 text-yellow-400">
            <Chat className="h-8 w-8" />
          </div>
          <h3 className="heading-sm">Comments</h3>
          <p className="text">
            Got a question or just have something to say? You and your
            participants can comment on polls to start a discussion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Features;
