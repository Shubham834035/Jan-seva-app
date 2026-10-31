"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, getCurrentUser, Complaint, CommonProblem, User } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  MapPin,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from "lucide-react";

export default function CitizenDashboardPage() {
  const { lang, t } = useI18n();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [nearbyProblems, setNearbyProblems] = useState<CommonProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.push("/login");
      return;
    }
    setUser(cur);

    Promise.all([
      api.getMyComplaints(),
      api.listCommonProblems()
    ])
      .then(([myComps, commonProbs]) => {
        setComplaints(myComps);
        setNearbyProblems(commonProbs.slice(0, 4));
      })
      .catch((err) => console.error("Dashboard data load error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Loading citizen dashboard...
      </div>
    );
  }

  // Calculate metrics
  const total = complaints.length;
  const underReview = complaints.filter((c) =>
    ["SUBMITTED", "RECEIVED_BY_PLATFORM", "UNDER_REVIEW"].includes(c.status)
  ).length;
  const inProgress = complaints.filter((c) =>
    ["ASSIGNED_PROTOTYPE", "IN_PROGRESS"].includes(c.status)
  ).length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Namaste, {user?.full_name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Welcome to your civic problem management portal. Track and report neighborhood issues.
          </p>
        </div>

        <Link
          href="/submit"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Problem</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500 font-medium">{t("totalSubmitted")}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{underReview}</div>
            <div className="text-xs text-gray-500 font-medium">{t("underReview")}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{inProgress}</div>
            <div className="text-xs text-gray-500 font-medium">{t("inProgress")}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{resolved}</div>
            <div className="text-xs text-gray-500 font-medium">{t("resolved")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Complaints (2 cols on large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">{t("recentReports")}</h2>
            {complaints.length > 0 && (
              <Link href="/complaints" className="text-xs font-semibold text-blue-600 hover:underline">
                View All ({complaints.length}) &rarr;
              </Link>
            )}
          </div>

          {complaints.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-700 font-semibold">{t("noComplaintsYet")}</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Notice a broken streetlight, pothole, or garbage accumulation in your neighborhood?
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
              >
                <span>Report Problem Now</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      #{comp.tracking_number}
                    </span>
                    <StatusBadge status={comp.status} />
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 leading-snug">
                    <Link href={`/complaints/${comp.id}`} className="hover:text-blue-600 transition">
                      {comp.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {comp.description}
                  </p>

                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{comp.locality_landmark}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span>{new Date(comp.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                      <Link
                        href={`/complaints/${comp.id}`}
                        className="font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <span>Track</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Nearby Common Problems Hotspots */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">Nearby Civic Hotspots</h2>
            <Link href="/common-problems" className="text-xs font-semibold text-blue-600 hover:underline">
              Map View &rarr;
            </Link>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <p className="text-xs text-gray-500">
              Shared community issues with multiple citizen reports grouped together:
            </p>

            {nearbyProblems.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No common problems registered yet.</p>
            ) : (
              <div className="space-y-3">
                {nearbyProblems.map((p) => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-600 text-[11px]">
                        {p.report_count} Citizens Reported
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <h4 className="font-semibold text-xs text-gray-900 leading-snug line-clamp-2">
                      <Link href={`/common-problems/${p.id}`} className="hover:text-blue-600">
                        {p.title}
                      </Link>
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{p.locality_name}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                href="/common-problems"
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Browse All Common Issues on Map &rarr;
              </Link>
            </div>
          </div>

          {/* Citizen Rights & Rules Info Card */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/70 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-blue-900 font-bold">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Citizen Rights & Resolution Dispute</span>
            </div>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              If an authority officer marks your issue as &ldquo;Resolved&rdquo; but the physical work on the ground is incomplete, you have the right to click &ldquo;Dispute Resolution&rdquo; to reopen the complaint for administrative review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
