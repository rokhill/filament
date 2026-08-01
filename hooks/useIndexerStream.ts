"use client";
import { useEffect } from "react";

type StreamEvent = "swap" | "forge_trade" | "coin_created" | "graduation" | "pair_created";

export function useIndexerStream(
  events: StreamEvent[],
  handler: (event: StreamEvent, data: any) => void
) {
  useEffect(() => {
    const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
    if (!INDEXER) return;
    const es = new EventSource(`${INDEXER}/api/v1/stream`);
    for (const ev of events) {
      es.addEventListener(ev, (e: MessageEvent) => {
        try { handler(ev, JSON.parse(e.data)); } catch {}
      });
    }
    es.onerror = () => es.close();
    return () => es.close();
  }, []);
}

export default useIndexerStream;
