"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from "lightweight-charts";

type Candle = { ts: number; open: number; high: number; low: number; close: number; volume_lcai: number; };

export default function TradingChart({ pair, symbol }: { pair: string; symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const INDEXER = process.env.NEXT_PUBLIC_INDEXER_URL || "";
    if (!INDEXER) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#9ca3af" },
      grid: { vertLines: { color: "rgba(255,140,30,0.05)" }, horzLines: { color: "rgba(255,140,30,0.05)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,140,30,0.2)" },
      timeScale: { borderColor: "rgba(255,140,30,0.2)", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 320,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#4ade80", downColor: "#f87171",
      borderUpColor: "#4ade80", borderDownColor: "#f87171",
      wickUpColor: "#4ade80", wickDownColor: "#f87171",
    });

    const volSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(255,140,30,0.3)",
      priceFormat: { type: "volume" as const },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    fetch(`${INDEXER}/api/v1/pairs/${pair}/candles?period=3600&limit=200`)
      .then(r => r.json())
      .then((candles: Candle[]) => {
        if (!candles.length) return;
        candleSeries.setData(candles.map(c => ({ time: c.ts as any, open: c.open, high: c.high, low: c.low, close: c.close })));
        volSeries.setData(candles.map(c => ({ time: c.ts as any, value: c.volume_lcai, color: c.close >= c.open ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)" })));
        chart.timeScale().fitContent();
      }).catch(() => {});

    const resize = () => { if (containerRef.current && chartRef.current) chartRef.current.applyOptions({ width: containerRef.current.clientWidth }); };
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, [pair]);

  return (
    <div className="rounded-xl overflow-hidden mb-4" style={{ background: "var(--ae-night)", border: "1px solid var(--clr-border)" }}>
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-xs font-semibold" style={{ color: "var(--ae-aurum)" }}>📊 {symbol}/LCAI · 1H Candles</span>
        <span className="text-xs" style={{ color: "var(--ae-nebula)" }}>Powered by Filament Indexer™</span>
      </div>
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
}
