import { Token } from "@/types/Token";
import { clsx, type ClassValue } from "clsx"
import { ParsedUrlQuery, stringify as stringifyQueryString } from "querystring";
import { twMerge } from "tailwind-merge"

export const MAX_UINT256 = 2n ** 256n - 1n;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (num: number | string | undefined) => {
  if (!num) return 0;
  return Number(num).toLocaleString(undefined, {
    maximumSignificantDigits: 6,
    notation: "compact",
  });
};

export const sortTokens = (a: Token, b: Token) =>
  a?.address && b?.address ? a.address?.localeCompare(b?.address) : 0;

export const getRouteAsPath = (pathname: string, query: NodeJS.Dict<string | (string | undefined)[]>, hash?: string | null) => {
  const remainingQuery = { ...query };

  // Replace slugs, and remove them from the `query` and filter undefined values
  let asPath = pathname.replace(/\[{1,2}(.+?)]{1,2}/g, ($0, slug: string) => {
    if (slug.startsWith("...")) slug = slug.replace("...", "");

    const value = remainingQuery[slug]!;
    delete remainingQuery[slug];
    if (Array.isArray(value)) {
      return value.filter(Boolean).map((v) => encodeURIComponent(v as string)).join("/");
    }
    return value !== undefined ? encodeURIComponent(String(value)) : "";
  });

  // Remove any trailing slashes; this can occur if there is no match for a catch-all slug ([[...slug]])
  asPath = removeTrailingSlash(asPath);

  // Append remaining query as a querystring, if needed:
  const qs = stringifyQueryString(remainingQuery as ParsedUrlQuery);

  if (qs) asPath += `?${qs}`;
  if (hash) asPath += hash;

  return asPath;
}


export const removeTrailingSlash = (path: string) => {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}