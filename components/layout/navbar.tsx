"use client";

import { useContext } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

import { docsConfig } from "@/config/docs";
import { marketingConfig } from "@/config/marketing";
import { siteConfig } from "@/config/site";
import { Z_INDEX } from "@/config/z-index";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocsSearch } from "@/components/docs/search";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { ModalContext } from "@/components/modals/providers";
import { ClientOnly } from "@/components/shared/client-only";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface NavBarProps {
  scroll?: boolean;
  large?: boolean;
}

export function NavBar({ scroll = false }: NavBarProps) {
  const scrolled = useScroll(50);
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { setShowSignInModal } = useContext(ModalContext);

  const selectedLayout = useSelectedLayoutSegment();
  const documentation = selectedLayout === "docs";

  const configMap = {
    docs: docsConfig.mainNav,
  };

  const links =
    (selectedLayout && configMap[selectedLayout]) || marketingConfig.mainNav;

  return (
    <header
      className={`sticky top-0 flex w-full justify-center bg-background/60 backdrop-blur-xl transition-all ${
        scroll ? (scrolled ? "border-b" : "bg-transparent") : "border-b"
      }`}
      style={{ zIndex: Z_INDEX.navbar }}
    >
      <MaxWidthWrapper
        className="flex h-14 items-center justify-between lg:h-[60px]"
        large={documentation}
      >
        <div className="flex gap-component-lg md:gap-component-xl">
          <Link href="/" className="flex items-center space-x-1.5">
            <Icons.logo />
            <span className="font-urban text-lg font-bold sm:text-xl">
              {siteConfig.name}
            </span>
          </Link>

          {links && links.length > 0 ? (
            <nav className="hidden gap-component-lg md:flex">
              {links.map((item, index) => (
                <Link
                  key={index}
                  href={item.disabled ? "#" : item.href}
                  prefetch={true}
                  className={cn(
                    "mobile-touch-target responsive-text flex items-center font-medium transition-colors",
                    item.href.startsWith(`/${selectedLayout}`)
                      ? "text-foreground"
                      : "text-foreground/60 hover:text-foreground/80",
                    item.disabled && "cursor-not-allowed opacity-80",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center space-x-component-sm">
          <div className="hidden sm:block">
            <ModeToggle />
          </div>
          {/* right header for docs */}
          {documentation ? (
            <div className="hidden flex-1 items-center space-x-component-md sm:justify-end lg:flex">
              <div className="hidden lg:flex lg:grow-0">
                <DocsSearch />
              </div>
              <div className="flex lg:hidden">
                <Icons.search className="size-6 text-muted-foreground" />
              </div>
            </div>
          ) : null}

          <ClientOnly
            fallback={
              <Skeleton className="hidden h-9 w-28 rounded-full lg:flex" />
            }
          >
            {isAuthenticated && user ? (
              <Link
                href={user.role.includes("admin") ? "/admin" : "/dashboard"}
                className="hidden sm:block"
              >
                <Button
                  className="gap-component-xs rounded-full px-5"
                  variant="default"
                  size="sm"
                >
                  <span>Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Button
                className="mobile-touch-target hidden gap-component-xs rounded-full px-5 sm:flex"
                variant="default"
                size="sm"
                onClick={() => setShowSignInModal(true)}
              >
                <span>Sign In</span>
                <Icons.arrowRight className="size-4" />
              </Button>
            )}
          </ClientOnly>
        </div>
      </MaxWidthWrapper>
    </header>
  );
}
