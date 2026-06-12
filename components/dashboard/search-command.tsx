"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNavItem } from "@/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Icons } from "@/components/shared/icons";

export function SearchCommand({
  links,
  className,
}: {
  links: SidebarNavItem[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative size-9 shrink-0 justify-center rounded-md bg-muted/50 p-0 text-sm font-normal text-muted-foreground shadow-none sm:w-48 sm:justify-start sm:px-3 sm:pr-12 md:w-64 lg:w-72",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Icons.search className="size-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">
          Search
          <span className="hidden md:inline-flex">&nbsp;documentation</span>...
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.45rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {links.map((section) => {
            if (section.items.length === 0) return null;
            return (
              <CommandGroup key={section.title} heading={section.title}>
                {section.items.map((item) => {
                  const Icon = Icons[item.icon || "arrowRight"];
                  return (
                    <CommandItem
                      key={item.title}
                      onSelect={() => {
                        runCommand(() => router.push(item.href as string));
                      }}
                    >
                      <Icon className="mr-2 size-5" />
                      {item.title}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
