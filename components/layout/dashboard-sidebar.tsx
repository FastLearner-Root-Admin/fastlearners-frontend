"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { NavItem, SidebarNavItem } from "@/types";
import {
  CreditCard,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProjectSwitcher from "@/components/dashboard/project-switcher";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { NavUser } from "@/components/nav-user";
import { Icons } from "@/components/shared/icons";

function isActiveRoute(itemHref: string | undefined, currentPath: string) {
  if (!itemHref) return false;
  if (itemHref === currentPath) return true;
  // Dashboard roots should only match exactly to prevent highlighting on all sub-routes
  if (itemHref === "/dashboard" || itemHref === "/dashboard/superadmin") return false;
  return currentPath.startsWith(`${itemHref}/`);
}

interface DashboardSidebarProps {
  links: SidebarNavItem[];
}

export function DashboardSidebar({ links }: DashboardSidebarProps) {
  const path = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  // Determine if user is a guest
  const isGuest = user?.role[0] === "guest" || !isAuthenticated;

  // NOTE: Use this if you want save in local storage -- Credits: Hosna Qasmei
  //
  // const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
  //   if (typeof window !== "undefined") {
  //     const saved = window.localStorage.getItem("sidebarExpanded");
  //     return saved !== null ? JSON.parse(saved) : true;
  //   }
  //   return true;
  // });

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     window.localStorage.setItem(
  //       "sidebarExpanded",
  //       JSON.stringify(isSidebarExpanded),
  //     );
  //   }
  // }, [isSidebarExpanded]);

  const { isTablet } = useMediaQuery();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!isTablet);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  useEffect(() => {
    setIsSidebarExpanded(!isTablet);
  }, [isTablet]);

  const sidebarWidthClass = isSidebarExpanded
    ? "w-sidebar-expanded-sm lg:w-sidebar-expanded-lg xl:w-sidebar-expanded-xl"
    : "w-sidebar-collapsed";

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          sidebarWidthClass,
          "hidden shrink-0 transition-[width] duration-200 ease-linear md:block",
        )}
        aria-hidden="true"
      />
      <aside
        className={cn(
          sidebarWidthClass,
          "fixed inset-y-0 left-0 z-30 hidden border-r bg-background md:flex md:flex-col",
          "transition-[width] duration-200 ease-linear",
        )}
      >
        <div className="flex h-14 shrink-0 items-center p-component-sm lg:h-[60px] lg:p-component-md">
          {isSidebarExpanded ? <ProjectSwitcher /> : null}

          <Button
            variant="ghost"
            size="icon"
            className="mobile-touch-target ml-auto size-9 lg:size-8"
            onClick={toggleSidebar}
          >
            {isSidebarExpanded ? (
              <PanelLeftClose size={18} className="stroke-muted-foreground" />
            ) : (
              <PanelRightClose size={18} className="stroke-muted-foreground" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-component-lg p-component-md">
                {links.map((section) => {
                  if (section.items.length === 0) return null;
                  return (
                  <section key={section.title} className="flex flex-col gap-1">
                    {isSidebarExpanded ? (
                      <p className="text-xs text-muted-foreground">
                        {section.title}
                      </p>
                    ) : (
                      <div className="h-4" />
                    )}
                    {section.items.map((item) => {
                      const Icon = Icons[item.icon || "arrowRight"];
                      return (
                        item.href && (
                          <Fragment key={`link-fragment-${item.title}`}>
                            {isSidebarExpanded ? (
                              <Link
                                key={`link-${item.title}`}
                                href={item.disabled ? "#" : item.href}
                                aria-label={item.title}
                                aria-current={
                                  isActiveRoute(item.href, path) ? "page" : undefined
                                }
                                className={cn(
                                  "mobile-touch-target flex items-center gap-component-sm rounded-md p-component-sm text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                  isActiveRoute(item.href, path)
                                    ? "bg-muted"
                                    : "text-muted-foreground hover:text-accent-foreground",
                                  item.disabled &&
                                    "cursor-not-allowed opacity-80 hover:bg-transparent",
                                )}
                              >
                                <Icon className="size-5" aria-hidden="true" />
                                {item.title}
                                {item.badge && (
                                  <Badge
                                    className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full"
                                    aria-label={`${item.badge} notifications`}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </Link>
                            ) : (
                              <Tooltip key={`tooltip-${item.title}`}>
                                <TooltipTrigger asChild>
                                  <Link
                                    key={`link-tooltip-${item.title}`}
                                    href={item.disabled ? "#" : item.href}
                                    aria-label={item.title}
                                    aria-current={
                                      isActiveRoute(item.href, path) ? "page" : undefined
                                    }
                                    className={cn(
                                      "mobile-touch-target flex items-center gap-component-sm rounded-md py-component-sm text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                      isActiveRoute(item.href, path)
                                        ? "bg-muted"
                                        : "text-muted-foreground hover:text-accent-foreground",
                                      item.disabled &&
                                        "cursor-not-allowed opacity-80 hover:bg-transparent",
                                    )}
                                  >
                                    <span
                                      className="flex size-full items-center justify-center"
                                      aria-hidden="true"
                                    >
                                      <Icon className="size-5" />
                                    </span>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  {item.title}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </Fragment>
                        )
                      );
                    })}
                  </section>
                  );
                })}
              </nav>
        </ScrollArea>

        <div className="shrink-0 border-t border-border/40 p-component-sm xl:p-4">
                {isSidebarExpanded ? (
                  isGuest ? (
                    <UpgradeCard />
                  ) : (
                    user && (
                      <NavUser
                        user={{
                          name: user.name,
                          email: user.email,
                          image: user.image,
                          avatar: user.avatar,
                          role: user.role,
                        }}
                      />
                    )
                  )
                ) : null}

                {/* {isSidebarExpanded && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href="/dashboard/billing"
                        aria-label="Subscription"
                        className={cn(
                          "flex items-center gap-3 rounded-md p-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                          path === "/dashboard/billing"
                            ? "bg-muted"
                            : "text-muted-foreground hover:text-accent-foreground",
                        )}
                      >
                        <CreditCard className="size-5" aria-hidden="true" />
                        Subscription
                      </Link>

                      <Link
                        href="/support"
                        aria-label="Support"
                        className={cn(
                          "flex items-center gap-3 rounded-md p-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                          path === "/support"
                            ? "bg-muted"
                            : "text-muted-foreground hover:text-accent-foreground",
                        )}
                      >
                        <MessageCircle className="size-5" aria-hidden="true" />
                        Support
                      </Link>

                      <button
                        type="button"
                        aria-label="Logout"
                        onClick={() => {
                          // Prefer store logout (handles HttpOnly flow)
                          try {
                            void useAuthStore.getState().logout?.();
                          } catch {}
                        }}
                        className="flex items-center gap-3 rounded-md p-2 text-left text-sm font-medium text-destructive hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                      >
                        <LogOut className="size-5" aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  </div>
                )} */}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function MobileSheetSidebar({ links }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isSm, isMobile } = useMediaQuery();
  const { user, isAuthenticated } = useAuthStore();

  // Close sheet on route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Determine if user is a guest
  const isGuest = user?.role[0] === "guest" || !isAuthenticated;

  if (isSm || isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="mobile-touch-target size-9 shrink-0 md:hidden"
          >
            <Menu className="size-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <ScrollArea className="h-full overflow-y-auto">
            <div className="flex h-screen flex-col">
              <nav className="flex flex-1 flex-col gap-y-8 p-component-md text-lg font-medium sm:p-component-lg">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Icons.logo className="size-6" />
                  <span className="font-urban text-xl font-bold">
                    {siteConfig.name}
                  </span>
                </Link>

                <ProjectSwitcher />

                {links.map((section) => {
                  if (section.items.length === 0) return null;
                  return (
                  <section key={section.title} className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">
                      {section.title}
                    </p>

                    {section.items.map((item) => {
                      const Icon = Icons[item.icon || "arrowRight"];
                      return (
                        item.href && (
                          <Fragment key={`link-fragment-${item.title}`}>
                            <Link
                              key={`link-${item.title}`}
                              onClick={() => {
                                if (!item.disabled) setOpen(false);
                              }}
                              href={item.disabled ? "#" : item.href}
                              aria-label={item.title}
                              aria-current={
                                isActiveRoute(item.href, pathname) ? "page" : undefined
                              }
                              className={cn(
                                "mobile-touch-target flex items-center gap-component-sm rounded-md p-component-sm text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                isActiveRoute(item.href, pathname)
                                  ? "bg-muted"
                                  : "text-muted-foreground hover:text-accent-foreground",
                                item.disabled &&
                                  "cursor-not-allowed opacity-80 hover:bg-transparent",
                              )}
                            >
                              <Icon className="size-5" aria-hidden="true" />
                              {item.title}
                              {item.badge && (
                                <Badge
                                  className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full"
                                  aria-label={`${item.badge} notifications`}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </Fragment>
                        )
                      );
                    })}
                  </section>
                  );
                })}

                <div className="mt-auto">
                  {isGuest ? (
                    <UpgradeCard />
                  ) : (
                    user && (
                      <NavUser
                        user={{
                          name: user.name,
                          email: user.email,
                          image: user.image,
                          avatar: user.avatar,
                          role: user.role,
                        }}
                      />
                    )
                  )}
                </div>
              </nav>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
}
