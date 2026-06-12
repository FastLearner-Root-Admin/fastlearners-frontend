import { cn } from "@/lib/utils";

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  fluid?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export function Main({ fixed, className, fluid, ...props }: MainProps) {
  return (
    <main
      data-layout={fixed ? "fixed" : "auto"}
      className={cn(
        "min-w-0 max-w-full overflow-x-hidden px-4 py-6",
        fixed && "flex min-w-0 grow flex-col",
        !fluid &&
          "@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}
