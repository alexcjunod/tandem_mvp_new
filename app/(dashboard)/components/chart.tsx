"use client"

import { ComponentProps, ReactElement } from "react"
import { ResponsiveContainer, Tooltip, TooltipProps } from "recharts"
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

export type ChartConfig = {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartProps extends ComponentProps<"div"> {
  config: ChartConfig
  children: ReactElement
}

export function ChartContainer({
  config,
  children,
  className,
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

interface ChartTooltipProps<TData extends ValueType, TName extends NameType>
  extends TooltipProps<TData, TName> {
  indicator?: "dot" | "line"
  valueFormatter?: (value: number) => string
  labelFormatter?: (value: string | number) => string
}

export function ChartTooltip<TData extends ValueType, TName extends NameType>({
  active,
  payload,
  label,
  indicator = "dot",
  valueFormatter = (value) => `${value}`,
  labelFormatter = (value) => `${value}`,
}: ChartTooltipProps<TData, TName>) {
  if (!active || !payload) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {labelFormatter(label)}
          </span>
        </div>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              {indicator === "dot" && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {indicator === "line" && (
                <div
                  className="h-0.5 w-3"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-sm font-medium">
                {item.dataKey}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {valueFormatter(item.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartLegend({ content }: { content: ReactElement }) {
  return content
}

export function ChartLegendContent() {
  return (
    <div className="flex gap-4">
      {/* Add legend content here if needed */}
    </div>
  )
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  indicator,
}: TooltipProps<ValueType, NameType> & {
  valueFormatter?: (value: number) => string
  labelFormatter?: (value: string | number) => string
  indicator?: "dot" | "line"
}) {
  if (!active || !payload) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {labelFormatter ? labelFormatter(label) : label}
          </span>
        </div>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              {indicator === "dot" && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {indicator === "line" && (
                <div
                  className="h-0.5 w-3"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-sm font-medium">
                {item.name || item.dataKey}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {valueFormatter ? valueFormatter(item.value as number) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
} 