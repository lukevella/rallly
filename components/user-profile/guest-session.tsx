import axios from "axios";
import clsx from "clsx";
import * as React from "react";
import { useForm } from "react-hook-form";
import { validEmail } from "utils/form-validation";

import Button from "@/components/button";

const GuestSession: React.VoidFunctionComponent = () => {
  const { handleSubmit, register, formState, getValues } = useForm<{
    email: string;
  }>({
    defaultValues: {
      email: "",
    },
  });
  return (
    <div className="card border-amber-500 ring-2 ring-amber-500/20">
      <h2>Guest session</h2>
      <p>
        Guest sessions allow us to remember your device so that you can edit
        your votes and comments later. However, these sessions are temporary and
        when they end, cannot be resumed.{" "}
        <a href="">Read more about guest sessions.</a>
      </p>
      <p>Login with your email to make sure you don&apos;t lose access:</p>
      {formState.submitCount > 0 ? (
        <div>
          An email has been sent to <strong>{getValues("email")}</strong>.
          Please check your inbox.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(({ email }) => {
            axios.post("/api/login", { email });
          })}
        >
          <input
            {...register("email", {
              validate: validEmail,
            })}
            className={clsx("input w-full", {
              "input-error": formState.errors.email,
            })}
            placeholder="Email address"
          />
          {formState.errors.email ? (
            <div className="mt-1 text-sm text-red-500">
              Please enter a valid email address
            </div>
          ) : null}
          <div className="mt-4 flex space-x-3">
            <Button htmlType="submit" type="primary">
              Login
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default GuestSession;
