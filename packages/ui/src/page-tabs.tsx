"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "./lib/utils";

function Tabs(props: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="page-tabs" {...props} />;
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="page-tabs-list"
      activateOnFocus
      className={cn(
        "-mb-px flex space-x-4 border-gray-200 border-b border-b-border",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="page-tabs-trigger"
      className={cn(
        "inline-flex h-9 items-center whitespace-nowrap rounded-none border-b-2 px-1 pt-1 pb-1 font-medium text-sm ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "not-data-active:border-transparent not-data-active:text-muted-foreground not-data-active:hover:border-accent-border not-data-active:hover:text-accent-foreground data-active:border-foreground data-active:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="page-tabs-content"
      className={cn(
        "mt-4 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:mt-6",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
