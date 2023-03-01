import * as React from "react";

const HowItWorks: React.FunctionComponent = () => {
  return (
    <div className="bg-gradient-to-b from-transparent via-white to-white">
      <div className="mx-auto max-w-7xl py-16 px-8">
        <h2 className="heading text-center">How it works</h2>
        <p className="subheading text-center">It&#39;s simple!</p>
        <div className="grid grid-cols-3 gap-16">
          <div className="col-span-1">
            <h3 className="text-xl">Create a poll</h3>
            <p className="text">
              Choose options you would like your participants to choose from.
            </p>
          </div>
          <div className="col-span-1">
            <h3 className="text-xl">Share your link</h3>
            <p className="text">
              Share your unique link with your participants to give them access
              to the page.
            </p>
          </div>
          <div className="col-span-1">
            <h3 className="text-xl">Vote</h3>
            <p className="text">
              Participants vote for the dates they prefer. The option with the
              most votes wins!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
