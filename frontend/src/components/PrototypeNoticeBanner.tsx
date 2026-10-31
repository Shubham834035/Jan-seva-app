"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function PrototypeNoticeBanner() {
  const { t } = useI18n();

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-medium border-b border-amber-600 shadow-inner flex items-center justify-center space-x-2">
      <AlertCircle className="w-4 h-4 shrink-0 text-amber-950" />
      <span className="text-center">
        <strong>PROTOTYPE DEMONSTRATION:</strong> {t("prototypeDisclaimer")}
      </span>
    </div>
  );
}
