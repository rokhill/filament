'use client'
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const BackButton = ({className} : {className?: string}) => {
  const router = useRouter();
  return (
    <Button
      size={"icon"}
      onClick={() => router.back()}
      className={cn("text-primary bg-transparent hover:bg-[var(--clr-primary)] dark:hover:bg-[var(--clr-blackest)] hover:text-[var(--clr-primary)]", className)}
    >
      <ArrowLeftIcon size={20} />
    </Button>
  );
};

export default BackButton;
