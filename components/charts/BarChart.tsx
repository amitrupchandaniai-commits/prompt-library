"use client"

import { useState } from "react"

export type ChartBar = { label: string; value: number }
export type ChartColorSlot = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
export type ChartValueFormat = "currency" | "integer"

// A serializable format choice, not a function prop: this component is used
// from Server Component pages (app/(app)/costs, app/(app)/analytics), and
// Next.js can't pass an inline function from a Server Component to a Client
// Component ("Functions cannot be passed directly to Client Components").
const VALUE_FORMATTERS: Record<ChartValueFormat, (value: number) => string> = {
  currency: (v) => `$${v.toFixed(4)}`,
  integer: (v) => String(v),
}

// Literal class names so Tailwind's scanner can find them — a template-literal
// `bg-${colorVar}` string would never be generated.
const BAR_FILL_CLASS: Record<ChartColorSlot, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
}

/**
 * A single-hue bar chart: one color per chart, categories carried by the axis
 * labels beneath each bar. Per the dataviz skill, that means no legend is
 * needed here (a legend earns its place distinguishing *multiple* colors on
 * one chart — this is one metric, one hue, categorized by label, same as a
 * single-series chart needing only its title).
 */
export function BarChart({
  bars,
  color = "chart-1",
  format = "currency",
  emptyMessage = "No data yet.",
}: {
  bars: ChartBar[]
  color?: ChartColorSlot
  format?: ChartValueFormat
  emptyMessage?: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const formatValue = VALUE_FORMATTERS[format]

  if (bars.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const max = Math.max(...bars.map((b) => b.value), 0.000001)
  const fillClass = BAR_FILL_CLASS[color]

  return (
    <div>
      <div className="flex h-40 items-end gap-0.5" role="img" aria-label="Bar chart">
        {bars.map((bar, i) => {
          const heightPct = Math.max((bar.value / max) * 100, 2)
          return (
            <div key={bar.label} className="relative flex h-full flex-1 flex-col items-center justify-end">
              {hovered === i && (
                <div className="absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                  <span className="font-semibold tabular-nums">{formatValue(bar.value)}</span>
                  <span className="ml-1.5 text-muted-foreground">{bar.label}</span>
                </div>
              )}
              <div
                tabIndex={0}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                className={`w-full max-w-6 rounded-t-[4px] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring ${fillClass} ${
                  hovered === i ? "ring-2 ring-ring/50 ring-offset-1" : ""
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-0.5">
        {bars.map((bar) => (
          <div
            key={bar.label}
            title={bar.label}
            className="flex-1 truncate text-center text-[10px] text-muted-foreground"
          >
            {bar.label}
          </div>
        ))}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-muted-foreground select-none">
          View as table
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 font-medium">Label</th>
              <th className="py-1 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.label} className="border-t">
                <td className="py-1">{bar.label}</td>
                <td className="py-1 tabular-nums">{formatValue(bar.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
