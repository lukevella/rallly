import Home from "@/components/home";
import { getStaticTranslations } from "@/utils/page-translations";

export default function Page() {
  return <Home />;
}

export const getStaticProps = getStaticTranslations;
