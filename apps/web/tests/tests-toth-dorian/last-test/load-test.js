import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  vus: 10, // 10 gleichzeitige Users
  duration: "30s", // 30 Sekunden lang
};

export default function () {
  const res = http.get("http://localhost:3000/");
  check(res, {
    "status is 200": (res) => res.status === 200,
    "response time < 1s": (res) => res.timings.duration < 1000,
  });

  sleep(1);
}
