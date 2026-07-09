import { cn } from "@/lib/utils";
import { Token } from "@/types/Token";
import { useEffect, useState } from "react";

type Props = {
  token: Token;
  size?: number;
  className?: string;
};

export default function TokenAvatar({ token, size = 40, className }: Props) {
  const style = {
    width: size,
    height: size,
  };
  const [logo, setLogo] = useState(token.logoURI);
  useEffect(() => {
    setLogo(token.logoURI);
  }, [token]);
  if (!logo)
    return (
      <div
        style={style}
        className={cn(
          "flex items-center justify-center font-bold uppercase rounded-full bg-secondary p-1 text-[8px]",
          className
        )}
      >
        {token.symbol}
      </div>
    );
  return (
    <img
      key={token.symbol}
      src={logo}
      alt={`${token.symbol}`}
      width={size}
      height={size}
      style={style}
      className={cn("rounded-full", className)}
      loading="lazy"
      onError={() => setLogo(undefined)}
    />
  );
}
