import { prisma } from "@rallly/database";
import crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "php-serialize";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (validateWebhook(req.body)) {
    switch (req.body.alert_name) {
      case "subscription_created":
        // Handle payment succeeded
        await prisma.user.update({
          where: {
            id: req.body.passthrough,
          },
          data: {
            tier: 1,
          },
        });
      case "subscription_cancelled":
        await prisma.user.update({
          where: {
            id: req.body.passthrough,
          },
          data: {
            tier: 0,
          },
        });
    }
    console.log(req.body);
    res.status(200).end();
  } else {
    res.status(403).end();
  }
}

const pubKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqeebUAHmXruqcVeCzr7G
FnFPsGzLnREYVCHPBRdNRfHAw+wvM58q/LkWvyA3/AluiJspnYAZpai2C4yK8Sk5
u13MX5zpSsFKewHw6EzWvSXB4XHPRMAaTjpHh1nmIXVPP3rsG6OnZHY4PFb09B2W
sb1D/w3ayKbzrhy3hTd4iXGpa0yElFo3uBRECCY2fZLydGmpAbj+YHNmWfygSuGv
qOyYpNCAUBtNV7EAD1NtxhTj3Jk5Hnod5L6DGWjd6CiIohPMMuBI1tiedWcDVWT7
SHE3sug9v16uYiVY4+GmOos6yux/ZM6+gsqf6B3nge7zFQOiDPZRYjy3zBMjAJ+8
svY0MQRJttNIocWM65gCxpHxLaAI0kQh+W6h9m/xbmylTM0E3QVY9p/0uYtKN5Wy
wWpr1zHpzIvEqkgmCwX8IJnx5vltS8Xb5puWcWFN9uZVLMR3pqyRvKhdbfmdkIBe
yth5paFqnV5xkYQdpy8V391Z8Whz7aL+E1cmL4ENzoVuTyPY5aKNMEmtF1jQptlU
mnys4+xvcw6u3YtIvKqLh+tEChe8EEYV55OIXaNwx3UDSj+rpe63U/1/+aAwwBZm
pNip7o0AmYcrtPp0RVZinJokj20Ht4+E37Me2B8scURXltYdbU60E0NtWO19Hlet
iSdpNUhPNLX0ZQQU01GjHW0CAwEAAQ==
-----END PUBLIC KEY-----
`;

function ksort(obj: Record<string, unknown>) {
  const keys = Object.keys(obj).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const i in keys) {
    sortedObj[keys[i]] = obj[keys[i]];
  }
  return sortedObj;
}

function validateWebhook(jsonObj: any) {
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
  const serialized = serialize(jsonObj);
  // verify the serialized array against the signature using SHA1 with your public key.
  const verifier = crypto.createVerify("sha1");
  verifier.update(serialized);
  verifier.end();

  const verification = verifier.verify(pubKey, mySig);
  // Used in response if statement
  return verification;
}
