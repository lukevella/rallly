import { createEmailI18n } from "../i18n";
import { Section, SmallText } from "./styled-components";

/**
 * Monthly API poll usage as a bar with the reset underneath. A table rather
 * than nested divs, because Outlook ignores widths and backgrounds on divs.
 */
export async function ApiPollUsage({
  locale = "en",
  used,
  limit,
  color,
  resetIn,
  resetDate,
}: {
  locale?: string;
  used: number;
  limit: number;
  color: string;
  /** How far away the reset is, e.g. "in 3 weeks", formatted for the locale. */
  resetIn: string;
  /** When the count resets, formatted for the locale. */
  resetDate: string;
}) {
  const { t } = await createEmailI18n(locale);
  const percent = Math.min(100, Math.round((used / limit) * 100));
  return (
    <Section>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{
          borderCollapse: "separate",
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#E5E7EB",
        }}
      >
        <tbody>
          <tr>
            <td
              width={`${percent}%`}
              height={8}
              style={{ backgroundColor: color, height: 8, lineHeight: "8px" }}
            >
              &nbsp;
            </td>
            {percent < 100 ? (
              <td height={8} style={{ height: 8, lineHeight: "8px" }}>
                &nbsp;
              </td>
            ) : null}
          </tr>
        </tbody>
      </table>
      <SmallText style={{ margin: "8px 0 0" }}>
        {t("apiPollUsage_resets", {
          defaultValue: "{percent}% used · Resets {resetIn}, on {resetDate}",
          percent,
          resetIn,
          resetDate,
        })}
      </SmallText>
    </Section>
  );
}
