"use client";
import { useEffect, useRef } from "react";

type StreamEvent = "swap" | "forge_trade" | "coin_created" | "graduation" | "pair_created";

export function useIndexerStream(
  events: StreamEvent[],
  handler: (event: StreamEvent, data: any) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
    if (!INDEXER) return;
    const es = new EventSource(`${INDEXER}/api/v1/stream`);
    const listeners: [string, (e: MessageEvent) => void][] = [];
    for (const ev of events) {
      const fn = (e: MessageEvent) => {
        try { handlerRef.current(ev, JSON.parse(e.data)); } catch {}
      };
      es.addEventListener(ev, fn);
      listeners.push([ev, fn]);
    }
    es.onerror = () => { console.warn("[sse] error, closing"); es.close(); };
    es.onopen = () => console.log("[sse] connected to indexer stream");
    return () => {
      for (const [ev, fn] of listeners) es.removeEventListener(ev, fn);
      es.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default useIndexerStream;
