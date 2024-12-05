"use client"

import { useState, useEffect, useMemo } from 'react'
import { useGoals } from "@/hooks/use-goals"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'
import { format, subDays } from 'date-fns'

type TimeRangeType = "7d" | "30d" | "90d"

const ProgressChart = ({ goals }: { goals: any[] }) => {
  const data = goals.map(goal => ({
    name: goal.title,
    progress: goal.progress || 0,
    fill: goal.color || '#4DABF7'
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={90}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Goal
                        </span>
                        <span className="font-bold text-sm">
                          {payload[0].payload.name}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Progress
                        </span>
                        <span className="font-bold text-sm">
                          {payload[0].value}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
            <LabelList 
              dataKey="progress" 
              position="right" 
              formatter={(value: number) => `${value}%`}
              style={{ fontSize: '12px' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function AnalyticsPage() {
  const { goals, isLoading } = useGoals()
  const { user } = useUser()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Goals Progress Overview</CardTitle>
          <CardDescription>Track the progress of all your active goals</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressChart goals={goals} />
        </CardContent>
      </Card>
    </div>
  );
} 