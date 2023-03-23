import { Switch } from '@headlessui/react';
import { useTranslation } from "next-i18next";
import { useEffect,useState } from 'react';

import Moon from "@/components/icons/moon.svg";
import Sun from "@/components/icons/sun.svg";

function DarkModeSwitcher() {
  const { t } = useTranslation(["common"]);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    const isDarkModeEnabled = localStorage.getItem('nightwind-mode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkModeEnabled(isDarkModeEnabled);
  }, []);

  useEffect(() => {
    localStorage.setItem('nightwind-mode', darkModeEnabled.toString());
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkModeEnabled]);

  return (
    <Switch
      checked={darkModeEnabled}
      onChange={setDarkModeEnabled}
      className={`${
        darkModeEnabled ? 'bg-green-500' : 'bg-gray-200'
      } relative inline-flex h-6 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
    >
      <span className="sr-only">
        {t("enableDarkmode")}
      </span>
      <span
        className={`${
          darkModeEnabled ? 'translate-x-4' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      >
        {darkModeEnabled ? (
          <Moon className="text-black w-4 h-4 m-0.5" />
        ) : (
          <Sun className="text-black w-4 h-4 m-0.5" />
        )}
      </span>
    </Switch>
  );
}

export default DarkModeSwitcher;
