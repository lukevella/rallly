"use client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import * as React from "react";
import { useMedia } from "react-use";
import { Spinner } from "@/components/spinner";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import { VotingForm } from "@/features/poll/components/voting-form";
import { useTranslation } from "@/i18n/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { EventDetailsList, EventTitle } from "./components/event-header";

/**
 * The voting grid depends on two things the server cannot know: the
 * viewer's zone and Intl output for the option dates, and the viewport
 * breakpoint that picks the desktop or mobile layout. Rather than render the
 * rest of the page around a placeholder and let the grid shift it, the
 * whole page waits for hydration behind the same spinner the route streams
 * while its data loads, so there is one loader from first byte to
 * interactive. The page's server props are already in the tree by then, so
 * nothing else is fetched.
 */
export function InvitePage({
  description,
  footerLinks,
}: {
  description: React.ReactNode;
  footerLinks: { label: string; href: string }[];
}) {
  const { t } = useTranslation();
  const hydrated = useHydrated();
  // From lg the details column can fold away to give the table the width.
  const [collapsed, setCollapsed] = React.useState(false);
  const isLarge = useMedia("(min-width: 1024px)", false);

  if (!hydrated) {
    return <InvitePageLoading />;
  }

  return (
    // Below lg the page scrolls as one column: title, details, poll. From lg
    // it fills the viewport with one card: the event on the left, the table
    // on the right scrolling inside itself.
    <div
      data-fill-viewport
      className="relative p-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:p-6 lg:pt-4"
    >
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "mx-auto w-full max-w-7xl lg:grid lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-card-border lg:bg-card lg:shadow-2xs lg:transition-[grid-template-columns] lg:duration-300 lg:ease-out",
          collapsed
            ? "lg:grid-cols-[0rem_minmax(0,1fr)]"
            : "lg:grid-cols-[20rem_minmax(0,1fr)]",
        )}
      >
        <aside
          className={cn(
            "lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:border-r",
            collapsed && "lg:border-r-0",
          )}
        >
          {/* Fixed at the open column's width, so as the column narrows the
              table slides over the details rather than squashing them.
              Collapsing only applies from lg; while collapsed the details
              are inert so they cannot be reached with the keyboard. */}
          <div
            inert={collapsed && isLarge}
            className="lg:flex lg:min-h-0 lg:w-80 lg:flex-1 lg:shrink-0 lg:flex-col lg:p-6"
          >
            <EventTitle
              description={description}
              className="pt-3 lg:pt-0"
              action={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="-mt-0.5 -mr-2 hidden shrink-0 text-muted-foreground lg:inline-flex"
                  aria-label={t("inviteHideDetails", {
                    defaultValue: "Hide details",
                  })}
                  aria-expanded={true}
                  onClick={() => setCollapsed(true)}
                >
                  <PanelLeftCloseIcon />
                </Button>
              }
            />
            <EventDetailsList className="py-6 lg:grid-cols-1 lg:pb-0" />
            {/* From lg it sits in the sidebar's spare space, so the table
                keeps the full height of the card. */}
            <div className="mt-auto hidden pt-6 lg:block">
              <PollFooter footerLinks={footerLinks} />
            </div>
          </div>
        </aside>
        <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
          <VotingForm>
            {/* The combined card is the frame from lg, so the poll's own
                card gives up its border there. */}
            <ResponsiveResults
              cardClassName="lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none"
              desktopHeaderStart={
                collapsed ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="-ml-1.5 hidden text-muted-foreground lg:inline-flex"
                    aria-label={t("inviteShowDetails", {
                      defaultValue: "Show details",
                    })}
                    aria-expanded={false}
                    onClick={() => setCollapsed(false)}
                  >
                    <PanelLeftOpenIcon />
                  </Button>
                ) : null
              }
            />
          </VotingForm>
        </div>
      </main>
      <div className="mt-3 lg:hidden">
        <PollFooter footerLinks={footerLinks} />
      </div>
      <div className="h-24 lg:hidden" />
    </div>
  );
}

export function InvitePageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}
