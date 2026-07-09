import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border-2 border-[var(--clr-border-light)] dark:border-[var(--clr-border)] bg-transparent dark:bg-[var(--clr-extra07)] px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition duration-300 ease-in-out",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "focus:border-[var(--clr-primary)] dark:focus:border-[var(--clr-primary)] focus:shadow-[var(--shadow-input)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
