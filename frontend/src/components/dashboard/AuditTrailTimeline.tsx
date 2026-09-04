"use client";

import React from "react";
import { AuditEvent } from "@/lib/types";
import { History, Shield, CheckCircle, Flame, BrainCircuit, Play, UserCheck } from "lucide-react";

interface AuditTrailTimelineProps {
  events: AuditEvent[];
}

export const AuditTrailTimeline: React.FC<AuditTrailTimelineProps> = ({ events }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "CHAOS_INJECTED":
        return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case "ROOT_CAUSE_ANALYSIS_COMPLETED":
        return <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />;
      case "STRATEGY_HUMAN_APPROVED":
        return <UserCheck className="w-3.5 h-3.5 text-amber-400" />;
      case "TEST_MODE_ACTION_EXECUTED":
        return <Play className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-gray-800 text-gray-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Immutable Audit Trail</h3>
            <p className="text-xs text-gray-400">Verifiable chronological event log</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">
          {events.length} Events Logged
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            No audit events recorded yet. Inject a failure scenario to begin.
          </p>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="p-3 rounded-xl bg-gray-950/60 border border-gray-800/80 text-xs flex items-start justify-between space-x-3 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start space-x-2.5">
                <div className="p-1.5 rounded-md bg-gray-900 border border-gray-800 mt-0.5">
                  {getActionIcon(ev.action)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-gray-400 text-[11px]">
                      {formatTimestamp(ev.timestamp)}
                    </span>
                    <span className="font-bold text-gray-200 font-mono text-[11px]">
                      {ev.action}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
                      {ev.actor}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{ev.notes || "Event recorded."}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                  ev.decision === "ALLOW" || ev.decision === "APPROVED" || ev.decision === "EXECUTED"
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900/60"
                    : "bg-red-950/80 text-red-400 border border-red-900/60"
                }`}
              >
                {ev.decision}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
