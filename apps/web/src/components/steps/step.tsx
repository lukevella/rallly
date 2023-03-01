import React from "react";

export interface StepProps {
  title: string;
  children?: React.ReactNode;
}

const Step: React.FunctionComponent<StepProps> = ({ title, children }) => {
  return (
    <div>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  );
};

export default Step;
