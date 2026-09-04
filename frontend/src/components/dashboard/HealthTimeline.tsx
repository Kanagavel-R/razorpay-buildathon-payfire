"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";

interface HealthTimelineProps {
  isDegraded: boolean;
  isRecovered: boolean;
  currentSuccessRate: number;
  currentLatency: number;
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({
  isDegraded,
  isRecovered,
  currentSuccessRate,
  currentLatency,
}) => {
  // Construct dynamic timeline data reflecting state progression
  const generateTimelineData = () => {
    const points = [
      { time: "10:00", successRate: 98.6, latency: 810, state: "Healthy" },
      { time: "10:02", successRate: 98.4, latency: 830, state: "Healthy" },
      { time: "10:04", successRate: 98.5, latency: 805, state: "Healthy" },
    ];

    if (isDegraded) {
      points.push(
        { time: "10:06", successRate: 91.2, latency: 1950, state: "Chaos Injected" },
        {
          time: "10:08",
          successRate: Number((currentSuccessRate * 100).toFixed(1)),
          latency: Math.round(currentLatency),
          state: "Degraded Outage",
        }
      );
    } else {
      points.push(
        { time: "10:06", successRate: 98.5, latency: 820, state: "Healthy" },
        { time: "10:08", successRate: 98.6, latency: 815, state: "Healthy" }
      );
    }

    if (isRecovered) {
      points.push(
        { time: "10:10", successRate: 94.8, latency: 1400, state: "Reroute Active" },
        { time: "10:12", successRate: 97.9, latency: 990, state: "Recovered" }
      );
    }

    return points;
  };

  const data = generateTimelineData();

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Payment System Health Timeline</span>
          </h3>
          <p className="text-xs text-gray-400">
            Real-time telemetry showing success rate (%) and latency (ms)
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-gray-300">Success Rate</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-gray-300">Latency (ms)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={11} domain={[60, 100]} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                borderColor: "#374151",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#f3f4f6",
              }}
            />
            <Area
              type="monotone"
              dataKey="successRate"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#successGrad)"
              name="Success Rate (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {isDegraded && (
        <div className="mt-3 flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Degradation Detected:</strong> Success rate plunged to{" "}
              {(currentSuccessRate * 100).toFixed(1)}%. Revenue at risk active.
            </span>
          </div>
          <span className="font-mono text-red-300 font-semibold">Incident Active</span>
        </div>
      )}
    </div>
  );
};
