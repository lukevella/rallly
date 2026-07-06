import { getPrimaryColorVars } from "@/features/branding/color";

export function BrandStyle({ primaryColor }: { primaryColor: string }) {
  const v = getPrimaryColorVars(primaryColor);
  return (
    <style>{`
          .light {
            --primary: ${v.light};
            --primary-foreground: ${v.lightForeground};
          }
          .dark {
            --primary: ${v.dark};
            --primary-foreground: ${v.darkForeground};
          }
        `}</style>
  );
}
