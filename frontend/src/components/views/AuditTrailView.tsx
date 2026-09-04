"use client";

import React, { useState } from "react";
import { AuditEvent } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FileText,
  Search,
  CheckCircle,
  Flame,
  BrainCircuit,
  Play,
  UserCheck,
  Code,
  Shield,
  Filter,
} from "lucide-react";

interface AuditTrailViewProps {
  events: AuditEvent[];
}

export function AuditTrailView({ events }: AuditTrailViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CHAOS_INJECTED":
        return <Flame className="h-3.5 w-3.5 text-rose-400" />;
      case "ROOT_CAUSE_ANALYSIS_COMPLETED":
        return <BrainCircuit className="h-3.5 w-3.5 text-indigo-400" />;
      case "STRATEGY_HUMAN_APPROVED":
        return <UserCheck className="h-3.5 w-3.5 text-amber-400" />;
      case "TEST_MODE_ACTION_EXECUTED":
        return <Play className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <CheckCircle className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.notes && ev.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterAction === "ALL" || ev.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header with Search and Filter */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Cryptographic Audit Ledger
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                SHA-256 HASH CHAIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only audit trail capturing every chaos perturbation, AI inference, operator sign-off, and canary route change.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">
              Total Logged: <strong className="text-white">{events.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit records by actor, action, or payload notes..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Event Types</option>
              <option value="CHAOS_INJECTED">Chaos Injected</option>
              <option value="ROOT_CAUSE_ANALYSIS_COMPLETED">RCA Completed</option>
              <option value="STRATEGY_HUMAN_APPROVED">Human Approved</option>
              <option value="TEST_MODE_ACTION_EXECUTED">Action Executed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Event Timeline */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No Matching Audit Events"
            description="No audit events matched your search query or filter. Inject a failure scenario in Chaos Lab to generate entries."
            icon={FileText}
          />
        ) : (
          filteredEvents.map((ev) => {
            const isExpanded = expandedId === ev.id;
            return (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                      {getActionIcon(ev.action)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white tracking-tight">
                          {ev.action}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {ev.actor}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(ev.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{ev.notes || "Event committed."}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <StatusBadge
                      status={
                        ev.decision === "ALLOW" ||
                        ev.decision === "APPROVED" ||
                        ev.decision === "EXECUTED"
                          ? "PASS"
                          : "BLOCKED"
                      }
                    />
                    {(ev.input_data || ev.result_data) && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center space-x-1"
                      >
                        <Code className="h-3 w-3" />
                        <span>{isExpanded ? "Hide Payload" : "View Payload"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Technical Payload */}
                {isExpanded && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    <div className="text-slate-400 font-semibold mb-1">
                      Event Record: {ev.id}
                    </div>
                    <pre className="text-xs text-slate-300">
                      {JSON.stringify(
                        {
                          action: ev.action,
                          actor: ev.actor,
                          incident_id: ev.incident_id,
                          strategy_id: ev.strategy_id,
                          input_data: ev.input_data,
                          result_data: ev.result_data,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
