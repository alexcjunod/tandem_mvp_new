"use client"

import { ComponentProps } from "react"
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
  hideLabel?: boolean
  nameKey?: string
}

export function CustomTooltip<TData extends ValueType, TName extends NameType>({
  active,
  payload,
  hideLabel = false,
  nameKey = "name",
}: ChartTooltipProps<TData, TName>) {
  if (!active || !payload) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {!hideLabel && (
                <span className="text-sm text-muted-foreground">
                  {item.payload[nameKey]}
                </span>
              )}
            </div>
            <span className="text-sm font-medium">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ChartTooltipContent } from "recharts"
