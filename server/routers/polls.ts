import { createRouter } from "../createRouter";
import { demo } from "./polls/demo";

export const polls = createRouter().merge("demo.", demo);
