import Bell from "@/components/icons/bell.svg";
import Chat from "@/components/icons/chat.svg";
import Clock from "@/components/icons/clock.svg";
import DeviceMobile from "@/components/icons/device-mobile.svg";
import * as React from "react";

const Features: React.VoidFunctionComponent = () => {
  return (
    <div className="py-16 px-8 max-w-7xl mx-auto">
      <h2 className="heading">Features</h2>
      <p className="subheading">Everything you need to get the job done</p>
      <div className="grid grid-cols-2 gap-12">
        <div className="col-span-2 md:col-span-1">
          <div className="p-3 bg-green-100/50 text-green-400 inline-block rounded-2xl mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="heading-sm flex items-center">
            Time slots
            <span className="ml-2 font-normal text-sm bg-green-500 text-white rounded-full px-2 py-1">
              New
            </span>
          </h3>
          <p className="text">
            If you need more granular options, Rallly lets you choose time slots
            as options. If your participants are international, they can see
            times in on their own time zone.
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="p-3 bg-cyan-100/50 text-cyan-400 inline-block rounded-2xl mb-4">
            <DeviceMobile className="w-8 h-8" />
          </div>
          <h3 className="heading-sm">Mobile friendly design</h3>
          <p className="text">
            Rallly is optimized to look and work great on mobile devices so you
            and your participants can use it on the go.
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="p-3 bg-rose-100/50 text-rose-400 inline-block rounded-2xl mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="heading-sm">Notifications</h3>
          <p className="text">
            Need help staying on top of things? Rallly can send you an email
            whenever participants vote or comment on your poll.
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="p-3 bg-yellow-100/50 text-yellow-400 inline-block rounded-2xl mb-4">
            <Chat className="w-8 h-8" />
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
