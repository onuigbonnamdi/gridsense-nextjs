"use client";

import { useEffect, useState } from "react";
import { getForecast } from "@/lib/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { formatBestTimeFromForecast, forecastPoints, pointDemand, pointTime } from "@/app/lib/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

export function ForecastChart({
  large = false,
  onBestTime,
}: {
  large?: boolean;
  onBestTime?: (v: string | null) => void;
}) {
  const [chartData, setChartData] = useState<any>(null);
  const [status, setStatus] = useState("Loading forecast…");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getForecast();
        const best = formatBestTimeFromForecast(data);
        if (mounted) onBestTime?.(best);

        const pts = forecastPoints(data);
        if (!mounted) return;
        if (!pts.length) {
          setStatus(
            "Forecast failed to load. Please check the backend endpoint.",
          );
          return;
        }

        const shown = large ? pts.slice(0, 48) : pts.slice(0, 12);
        setChartData({
          labels: shown.map((p: any) => {
            const t = pointTime(p);
            return t
              ? new Date(t).toLocaleString(
                  "en-GB",
                  large
                    ? { weekday: "short", hour: "2-digit" }
                    : { hour: "2-digit", minute: "2-digit" },
                )
              : "";
          }),
          datasets: [
            {
              label: "Forecast demand",
              data: shown.map(pointDemand),
              borderColor: "#10b99f",
              backgroundColor: "rgba(16,185,159,.10)",
              fill: true,
              tension: 0.42,
              borderWidth: 2,
              pointRadius: large ? 2 : 0,
            },
          ],
        });
        setStatus("");
      } catch {
        if (mounted)
          setStatus(
            "Forecast failed to load. Please check the backend endpoint.",
          );
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [large, onBestTime]);

  if (!chartData) return <div className="chart-empty">{status}</div>;

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: large } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#64748b" } },
          y: {
            grid: { color: "rgba(100,116,139,.14)" },
            ticks: { color: "#64748b" },
          },
        },
      }}
    />
  );
}
