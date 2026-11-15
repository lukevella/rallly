// Target user personas, one space each under dev@rallly.co so switching
// spaces switches persona. The casual social organizer, the largest free
// segment, is the existing "Personal" space in data.ts.

import { foodPantry } from "./personas/food-pantry";
import { graduateSchool } from "./personas/graduate-school";
import type { Persona } from "./personas/helpers";
import { hospitalEducation } from "./personas/hospital-education";
import { leadershipCoaching } from "./personas/leadership-coaching";
import { libraryAssociation } from "./personas/library-association";

export const personas: Persona[] = [
  graduateSchool,
  libraryAssociation,
  foodPantry,
  hospitalEducation,
  leadershipCoaching,
];
