// Original source: https://gist.github.com/dsumer/3594cda57e84a93a9019cddc71831882
import { prisma } from "@rallly/database";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import * as Serialize from "php-serialize";

import { PaddlePassthrough, PaddleRequest } from "@/paddle.interface";

const allowedIpAdresses = [
  // Sandbox
  "34.194.127.46",
  "54.234.237.108",
  "3.208.120.145",
  "44.226.236.210",
  "44.241.183.62",
  "100.20.172.113",
  // Production
  "34.232.58.13",
  "34.195.105.136",
  "34.237.3.244",
  "35.155.119.135",
  "52.11.166.252",
  "34.212.5.7",
];

const getIpAddress = (req: NextApiRequest): string => {
  const forwarded = req.headers["x-forwarded-for"] || "";
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0] || req.socket.remoteAddress || "";
  }
  return forwarded[0] || req.socket.remoteAddress || "";
};

function ksort(obj: Record<string, unknown>) {
  const keys = Object.keys(obj).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const i in keys) {
    sortedObj[keys[i]] = obj[keys[i]];
  }
  return sortedObj;
}

export function validateWebhook(req: NextApiRequest) {
  if (!allowedIpAdresses.includes(getIpAddress(req))) {
    console.error("No valid paddle ip address");
    return false;
  }

  let jsonObj = req.body;
  // Grab p_signature
  const mySig = Buffer.from(jsonObj.p_signature, "base64");
  // Remove p_signature from object - not included in array of fields used in verification.
  delete jsonObj.p_signature;
  // Need to sort array by key in ascending order
  jsonObj = ksort(jsonObj);
  for (const property in jsonObj) {
    if (
      jsonObj.hasOwnProperty(property) &&
      typeof jsonObj[property] !== "string"
    ) {
      if (Array.isArray(jsonObj[property])) {
        // is it an array
        jsonObj[property] = jsonObj[property].toString();
      } else {
        //if its not an array and not a string, then it is a JSON obj
        jsonObj[property] = JSON.stringify(jsonObj[property]);
      }
    }
  }
  // Serialise remaining fields of jsonObj
  const serialized = Serialize.serialize(jsonObj);
  // verify the serialized array against the signature using SHA1 with your public key.
  const verifier = crypto.createVerify("sha1");
  verifier.update(serialized);
  verifier.end();

  if (!process.env.PADDLE_PUBLIC_KEY) {
    throw new Error("Missing paddle public key");
  }

  const publicKey = crypto.createPublicKey(
    `-----BEGIN PUBLIC KEY-----\n${process.env.PADDLE_PUBLIC_KEY}\n-----END PUBLIC KEY-----`,
  );

  const isValid = verifier.verify(publicKey, mySig);

  if (!isValid) {
    console.error("Invalid paddle signature");
  }

  return isValid;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    // Your Paddle webhook code will be handled here

    // The webhook payload is sent as a form-data
    const payload: PaddleRequest = req.body;

    const isValid = validateWebhook(req);

    if (!isValid) {
      // The signature is not valid, response with an error
      return res.status(500).json({ error: "Invalid signature" });
    }

    let passthrough: PaddlePassthrough | null = null;
    try {
      passthrough = JSON.parse(payload.passthrough) as PaddlePassthrough;
    } catch {}
    if (!passthrough) {
      res.status(400).send("Invalid passthrough: " + payload.passthrough);
      return;
    }

    // At this point, the webhook is valid, handle the webhook event
    switch (payload.alert_name) {
      case "subscription_created": {
        // Handle new subscription
        const data = {
          subscriptionId: payload.subscription_id,
          status: payload.status,
          planId: payload.subscription_plan_id,
          endDate: new Date(payload.next_bill_date),
          updateUrl: payload.update_url,
          cancelUrl: payload.cancel_url,
        };

        await prisma.userPaymentData.upsert({
          where: {
            userId: passthrough.userId,
          },
          create: {
            userId: passthrough.userId,
            ...data,
          },
          update: data,
        });
        break;
      }
      case "subscription_payment_succeeded":
        // Handle successful payment
        await prisma.userPaymentData.update({
          where: {
            userId: passthrough.userId,
          },
          data: {
            status: payload.status,
            endDate: new Date(payload.next_bill_date),
          },
        });
        break;
      case "subscription_payment_failed":
        await prisma.userPaymentData.update({
          where: {
            userId: passthrough.userId,
          },
          data: {
            status: payload.status,
          },
        });
        break;

      case "subscription_updated":
        // Handle updated subscription
        await prisma.userPaymentData.update({
          where: {
            userId: passthrough.userId,
          },
          data: {
            status: payload.status,
            planId: payload.subscription_plan_id,
            endDate: new Date(payload.next_bill_date),
            updateUrl: payload.update_url,
            cancelUrl: payload.cancel_url,
          },
        });
        break;
      case "subscription_cancelled":
        // Handle cancelled subscription
        await prisma.userPaymentData.update({
          where: {
            userId: passthrough.userId,
          },
          data: {
            status: payload.status,
            endDate: new Date(payload.cancellation_effective_date),
          },
        });
        break;
      default:
        // If the webhook event is not handled, respond with an error
        return res.status(400).json({ error: "Webhook event not supported" });
    }

    // If everything went well, send a 200 OK
    return res.status(200).json({ success: true });
  } else {
  }
}
