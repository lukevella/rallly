import * as React from "react";

import Code from "@/components/icons/code.svg";
import CursorClick from "@/components/icons/cursor-click.svg";
import Server from "@/components/icons/server.svg";

import Ban from "./ban-ads.svg";

const Bonus: React.VoidFunctionComponent = () => {
  return (
    <div className="mx-auto max-w-7xl px-8 pt-8 pb-24">
      <h2 className="heading">Principles</h2>
      <p className="subheading">We&apos;re not like the others</p>
      <div className="grid grid-cols-4 gap-16">
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <CursorClick className="w-16" />
          </div>
          <h3 className="heading-sm">No login required</h3>
          <div className="text text-base leading-relaxed">
            We keep things simple and don&apos;t ask for more than what we need.
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Code className="w-16" />
          </div>
          <h3 className="heading-sm">Open-source</h3>
          <div className="text text-base leading-relaxed">
            The codebase is fully open-source and{" "}
            <a href="https://github.com/lukevella/rallly">
              available on github
            </a>
            .
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Server className="w-16" />
          </div>
          <h3 className="heading-sm">Self-hostable</h3>
          <div className="text text-base leading-relaxed">
            Run it on your own server to get full control of your data.
          </div>
        </div>
        <div className="col-span-4 md:col-span-2 lg:col-span-1">
          <div className="mb-4 text-gray-400">
            <Ban className="w-16" />
          </div>
          <h3 className="heading-sm">Ad-free</h3>
          <div className="text text-base leading-relaxed">
            You can give your ad-blocker a rest &ndash; You won&apos;t need it
            here.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
