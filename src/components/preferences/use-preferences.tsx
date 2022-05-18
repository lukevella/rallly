import { useRequiredContext } from "../use-required-context";
import { PreferencesContext } from "./preferences-provider";

export const usePreferences = () => {
  return useRequiredContext(PreferencesContext);
};
