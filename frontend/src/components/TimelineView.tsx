import React from "react";
import { TimelineEvent } from "@/lib/api";
import { CheckCircle2, Clock, AlertTriangle, UserCheck, ShieldAlert, FileText, ExternalLink } from "lucide-react";

interface TimelineViewProps {
  timeline: TimelineEvent[];
}

export default function TimelineView({ timeline }: TimelineViewProps) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-sm text-gray-500 italic">No timeline events recorded yet.</p>;
  }

  const getEventIcon = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "REJECTED":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-orange-600 animate-pulse" />;
      case "ASSIGNED_PROTOTYPE":
        return <UserCheck className="w-5 h-5 text-purple-600" />;
      case "UNDER_REVIEW":
        return <ShieldAlert className="w-5 h-5 text-yellow-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timeline.map((event, idx) => {
          const isLast = idx === timeline.length - 1;
          const formattedDate = new Date(event.created_at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          });

          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-white border border-gray-300 flex items-center justify-center ring-4 ring-white shadow-sm">
                    {getEventIcon(event.new_status)}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {event.action_title}
                      </h4>
                      <time className="text-xs text-gray-500 whitespace-nowrap">{formattedDate}</time>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-gray-700">{event.actor_name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        {event.actor_role}
                      </span>
                      {event.is_external_confirmed ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          External System Confirmed
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Platform Simulation
                        </span>
                      )}
                    </div>

                    {event.action_note && (
                      <div className="mt-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-2.5 leading-relaxed">
                        {event.action_note}
                      </div>
                    )}

                    {event.resolution_evidence_url && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-600 block mb-1">
                          Attached Resolution Evidence:
                        </span>
                        <a
                          href={event.resolution_evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 space-x-1"
                        >
                          <span>View Proof Photograph</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
