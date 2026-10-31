"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, Complaint, getCurrentUser } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  Building,
  ArrowRight
} from "lucide-react";

export default function MyComplaintsPage() {
  const { lang, t } = useI18n();
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    api.getMyComplaints()
      .then(setComplaints)
      .catch((err) => console.error("Error fetching complaints:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.locality_landmark.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && ["SUBMITTED", "RECEIVED_BY_PLATFORM", "UNDER_REVIEW", "ASSIGNED_PROTOTYPE", "IN_PROGRESS"].includes(c.status)) ||
      (statusFilter === "RESOLVED" && c.status === "RESOLVED");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t("navMyComplaints")}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track and monitor the status of all public issue reports submitted from your citizen account.
          </p>
        </div>

        <Link
          href="/submit"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Problem</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, landmark or #JS-..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                statusFilter === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({complaints.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                statusFilter === "ACTIVE" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("RESOLVED")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                statusFilter === "RESOLVED" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500">Loading complaints...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center space-y-3">
          <FileText className="w-10 h-10 text-gray-400 mx-auto" />
          <p className="text-sm font-semibold text-gray-800">No complaints matching your criteria.</p>
          <p className="text-xs text-gray-500">Try adjusting your search terms or filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((comp) => {
            const formattedDate = new Date(comp.created_at).toLocaleDateString("en-IN", {
              dateStyle: "medium",
            });

            return (
              <div
                key={comp.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      #{comp.tracking_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {lang === "hi" && comp.category?.name_hi ? comp.category.name_hi : comp.category?.name_en}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {comp.is_disputed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded border border-red-200">
                        Resolution Disputed
                      </span>
                    )}
                    <StatusBadge status={comp.status} />
                  </div>
                </div>

                <h3 className="font-bold text-base text-gray-900">
                  <Link href={`/complaints/${comp.id}`} className="hover:text-blue-600 transition">
                    {comp.title}
                  </Link>
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {comp.description}
                </p>

                <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500 items-center">
                  <div className="flex items-center space-x-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{comp.locality_landmark}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">
                      {comp.assigned_office?.name || "Routing under evaluation"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formattedDate}</span>
                    </span>
                    <Link
                      href={`/complaints/${comp.id}`}
                      className="inline-flex items-center space-x-1 font-bold text-blue-600 hover:text-blue-800"
                    >
                      <span>Track Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
