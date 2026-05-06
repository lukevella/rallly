import { connection } from "next/server";
import { BrandingProvider } from "../client";
import { getInstanceBrandingConfig } from "../queries";

export async function InstanceBrandingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const brandingConfig = await getInstanceBrandingConfig();

  return (
    <BrandingProvider value={brandingConfig}>
      <style>{`
          .light {
            --primary: ${brandingConfig.primaryColor.light};
            --primary-foreground: ${brandingConfig.primaryColor.lightForeground};
          }
          .dark {
            --primary: ${brandingConfig.primaryColor.dark};
            --primary-foreground: ${brandingConfig.primaryColor.darkForeground};
          }
        `}</style>
      {children}
    </BrandingProvider>
  );
}
