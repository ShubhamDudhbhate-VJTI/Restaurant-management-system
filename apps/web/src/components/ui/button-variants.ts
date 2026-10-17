import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(53,107,79,0.2)] hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(53,107,79,0.25)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_12px_rgba(163,84,62,0.2)] hover:bg-destructive/90 hover:shadow-[0_6px_20px_rgba(163,84,62,0.25)]",
        outline:
          "border border-border bg-transparent hover:bg-secondary hover:text-secondary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline lowercase tracking-normal font-normal",
      },
      size: {
        default: "px-4 py-2",
        sm: "min-h-9 rounded-lg px-3 text-xs",
        lg: "min-h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
