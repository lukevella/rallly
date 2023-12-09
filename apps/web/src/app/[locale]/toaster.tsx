"use client";

import {
  ToastBar as DefaultToasterBar,
  Toaster as DefaultToaster,
} from "react-hot-toast";

export default function Toaster() {
  return (
    <DefaultToaster reverseOrder={false} position="bottom-right">
      {(t) => <DefaultToasterBar toast={t} style={{}} />}
    </DefaultToaster>
  );
}
