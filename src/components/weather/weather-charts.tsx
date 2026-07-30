"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NormalizedForecast } from "@/types/weather";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

const charts = [
  { key: "temperature", title: "Suhu", unit: "°C", color: "#ea580c" },
  { key: "humidity", title: "Kelembapan", unit: "%", color: "#0f766e" },
  {
    key: "windSpeed",
    title: "Kecepatan angin",
    unit: "km/jam",
    color: "#059669",
  },
  { key: "cloudCover", title: "Tutupan awan", unit: "%", color: "#64748b" },
] as const;
export function WeatherCharts({
  forecasts,
}: {
  forecasts: NormalizedForecast[];
}) {
  const data = forecasts
    .slice(0, 24)
    .map((item) => ({ ...item, label: `${item.date.slice(5)} ${item.time}` }));
  return (
    <div>
      <div className="mb-5">
        <p className="eyebrow">Tren cuaca</p>
        <h2 className="section-title">Grafik prakiraan</h2>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {charts.map((chart) => (
          <Card key={chart.key}>
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="font-bold">{chart.title}</h3>
              <span className="text-sm text-slate-500">
                Satuan: {chart.unit}
              </span>
            </div>
            {data.some((item) => item[chart.key] != null) ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer>
                  <LineChart
                    data={data}
                    margin={{ top: 10, right: 10, bottom: 30, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      angle={-30}
                      textAnchor="end"
                      height={65}
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [
                        `${value} ${chart.unit}`,
                        chart.title,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey={chart.key}
                      stroke={chart.color}
                      strokeWidth={3}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
