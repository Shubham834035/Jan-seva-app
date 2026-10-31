"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, Complaint, getCurrentUser } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import TimelineView from "@/components/TimelineView";
import {
  ArrowLeft,
  MapPin,
  Building,
  Calendar,
  AlertTriangle,
  Camera,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  X
} from "lucide-react";

export default function ComplaintDetailsPage() {
  const { lang, t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispute Modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const fetchDetails = () => {
    api.getComplaintDetails(complaintId)
      .then(setComplaint)
      .catch((err) => setError(err.message || "Failed to load complaint details."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    fetchDetails();
  }, [complaintId]);

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim() || disputeReason.length < 10) {
      setDisputeError("Please provide a dispute explanation of at least 10 characters.");
      return;
    }

    setDisputeSubmitting(true);
    setDisputeError(null);

    try {
      await api.disputeComplaint(complaintId, disputeReason.trim());
      setShowDisputeModal(false);
      setDisputeReason("");
      fetchDetails();
    } catch (err: any) {
      setDisputeError(err.message || "Failed to dispute resolution.");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-500">Loading complaint details...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error || "Complaint not found or unauthorized access."}
        </div>
        <Link
          href="/complaints"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Complaints</span>
        </Link>
      </div>
    );
  }

  const canDispute = ["RESOLVED", "REJECTED"].includes(complaint.status) && !complaint.is_disputed;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/complaints"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Complaints List</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
              #{complaint.tracking_number}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              Priority: {complaint.priority}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {complaint.is_disputed && (
              <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-800 rounded-md border border-red-200">
                Resolution Disputed
              </span>
            )}
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          {complaint.title}
        </h1>

        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/70 p-4 rounded-xl border border-gray-200/80">
          {complaint.description}
        </p>

        {/* Location & Metadata Pill Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{complaint.locality_landmark}, {complaint.city}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              Submitted: {new Date(complaint.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          {complaint.latitude && complaint.longitude && (
            <div className="font-mono text-[11px] text-gray-400">
              Coordinates: {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Authority Details & Common Problem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Responsible Authority Mapping Box */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Assigned Responsible Office</span>
          </div>

          {complaint.assigned_office ? (
            <div className="space-y-2 text-xs">
              <div className="font-bold text-sm text-gray-900">{complaint.assigned_office.name}</div>
              <div className="text-gray-600 font-medium">{complaint.assigned_department?.name_en}</div>
              {complaint.assigned_office.contact_phone && (
                <div className="text-gray-500">
                  Office Helpline: <span className="font-mono text-gray-800">{complaint.assigned_office.contact_phone}</span>
                </div>
              )}
              {complaint.routing_notes && (
                <div className="mt-3 p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-blue-900">
                  <span className="font-semibold">Routing Rationale:</span> {complaint.routing_notes}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <strong>Unassigned / Under Review:</strong> No specific municipal office rule matched this jurisdiction yet. Placed in the platform administrator review queue.
            </div>
          )}
        </div>

        {/* Common Problem Grouping Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Smart Deduplication &amp; Common Problem</span>
          </div>

          {complaint.common_problem ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-900">Linked to Common Problem:</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  {complaint.common_problem.report_count} Citizens Reported
                </span>
              </div>
              <div className="font-bold text-gray-900">{complaint.common_problem.title}</div>
              <p className="text-gray-500 text-[11px]">
                Your individual complaint record is maintained separately for tracking, while contributing to the aggregate civic weight of this public issue.
              </p>
              <div className="pt-2">
                <Link
                  href={`/common-problems/${complaint.common_problem.id}`}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 hover:text-purple-900"
                >
                  <span>View Public Common Problem Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-800">Standalone Report</p>
              <p className="text-[11px]">
                No similar complaints have been detected nearby for this problem category yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Citizen Evidence Uploads */}
      {complaint.attachments && complaint.attachments.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Submitted Evidence Photographs</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {complaint.attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition"
              >
                <div className="bg-gray-100 h-28 flex items-center justify-center text-xs text-gray-500 font-medium group-hover:bg-blue-50">
                  <Camera className="w-6 h-6 text-gray-400 group-hover:text-blue-600 mb-1" />
                </div>
                <div className="p-2 bg-white text-[11px] truncate font-medium text-gray-700">
                  {att.original_filename}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Status Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {t("timelineTitle")}
            </h2>
            <p className="text-xs text-gray-500">
              Immutable audit history of status updates and administrative actions.
            </p>
          </div>

          {canDispute && (
            <button
              onClick={() => setShowDisputeModal(true)}
              className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Dispute Resolution / Reopen</span>
            </button>
          )}
        </div>

        <TimelineView timeline={complaint.timeline || []} />
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-red-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Dispute Resolution</span>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              If the reported issue has not been satisfactorily fixed on the ground, state your reason below. This will reopen the complaint and move it to <strong>Under Review</strong> for administrative investigation.
            </p>

            {disputeError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {disputeError}
              </div>
            )}

            <form onSubmit={handleDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Dispute *
                </label>
                <textarea
                  required
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. Debris was left on road after patch work; pothole is still 1 foot deep."
                  className="w-full p-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition"
                >
                  {disputeSubmitting ? "Submitting Dispute..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
