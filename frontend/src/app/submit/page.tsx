"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, ProblemCategory, GeographicArea, getCurrentUser } from "@/lib/api";
import {
  Send,
  MapPin,
  Camera,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ChevronDown
} from "lucide-react";

// Dynamic import for LeafletMap to avoid Next.js SSR window error
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded-lg border border-gray-300">
      Loading OpenStreetMap Leaflet component...
    </div>
  ),
});

export default function SubmitComplaintPage() {
  const { lang, t } = useI18n();
  const router = useRouter();

  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [areas, setAreas] = useState<GeographicArea[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [stateName, setStateName] = useState("Madhya Pradesh");
  const [districtName, setDistrictName] = useState("Devgarh");
  const [cityName, setCityName] = useState("Mayanagari");
  const [locality, setLocality] = useState("");
  const [latitude, setLatitude] = useState<number | null>(23.2520);
  const [longitude, setLongitude] = useState<number | null>(77.4120);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    Promise.all([api.getCategories(), api.getAreas()])
      .then(([cats, ars]) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);

        const wards = ars.filter((a) => a.area_type === "WARD_ZONE");
        setAreas(wards.length > 0 ? wards : ars);
        if (wards.length > 0) setAreaId(wards[0].id);
      })
      .catch((err) => console.error("Error loading categories/areas:", err))
      .finally(() => setLoadingInitial(false));
  }, []);

  const handleLocationSelect = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.length < 5) {
      setError("Please provide a title of at least 5 characters.");
      return;
    }

    if (!description.trim() || description.length < 15) {
      setError("Please provide a detailed description of at least 15 characters.");
      return;
    }

    if (!locality.trim() || locality.length < 3) {
      setError("Please specify the street landmark or locality.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category_id", categoryId);
      if (areaId) formData.append("geographic_area_id", areaId);
      formData.append("state", stateName);
      formData.append("district", districtName);
      formData.append("city", cityName);
      formData.append("locality_landmark", locality.trim());

      if (latitude !== null) formData.append("latitude", latitude.toString());
      if (longitude !== null) formData.append("longitude", longitude.toString());

      if (evidenceFile) {
        formData.append("evidence_file", evidenceFile);
      }

      const res = await api.submitComplaint(formData);
      router.push(`/complaints/${res.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit complaint. Please check your inputs.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8 space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-blue-600/80 text-blue-100 text-xs font-semibold">
            <Send className="w-3.5 h-3.5" />
            <span>Citizen Grievance Submission</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("submitComplaintTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            {t("submitSubtitle")}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Problem Category */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              {t("labelCategory")} *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-3 rounded-lg border text-left transition flex items-start space-x-2.5 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="pt-0.5">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setCategoryId(cat.id)}
                        className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-gray-900 leading-tight">
                        {lang === "hi" && cat.name_hi ? cat.name_hi : cat.name_en}
                      </span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">
                        {lang === "hi" ? cat.name_en : cat.name_hi}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  {t("labelTitle")} *
                </label>
                <span className="text-[11px] text-gray-400">{title.length}/200</span>
              </div>
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dangerous 2-foot pothole in front of Central Market"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  {t("labelDescription")} *
                </label>
                <span className="text-[11px] text-gray-400">{description.length}/2000</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide specific details such as when it started, hazards caused, or dimensions. Do not include private personal passwords."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location Fields & Ward Selector */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Geographic Location & Administrative Ward</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">District</label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Municipality</label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Configured Ward / Zone
                </label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Manual Review / Unknown --</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street Address / Landmark *
              </label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Near Bus Stand Pillar 4, Gandhi Nagar MG Road"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Interactive Leaflet Map for Location Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700">Interactive Location Picker</span>
                {latitude && longitude && (
                  <span className="text-[11px] font-mono text-gray-500">
                    Lat: {latitude.toFixed(5)}, Lon: {longitude.toFixed(5)}
                  </span>
                )}
              </div>
              <LeafletMap
                interactiveSelect={true}
                selectedLocation={latitude && longitude ? [latitude, longitude] : null}
                onLocationSelect={handleLocationSelect}
                height="280px"
              />
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>{t("labelEvidence")}</span>
            </label>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Supported formats: JPG, PNG, WEBP (Max 5MB). Photo will be visible to authorized officers.
              </p>
            </div>
          </div>

          {/* Privacy & Prototype Notice Box */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-1.5 text-amber-900">
            <div className="flex items-center space-x-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Citizen Privacy by Default Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              {t("privacyNotice")}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Evaluating & Submitting..." : t("btnSubmitComplaint")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
