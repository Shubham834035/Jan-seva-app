"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi";

interface I18nContextType {
  lang: Language;
  language: Language;
  setLang: (lang: Language) => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // App & Header
    appName: "Jan Seva",
    appTagline: "Citizen Problem Reporting, Smart Routing & Resolution Platform",
    prototypeBadge: "Prototype Simulation",
    navHome: "Home",
    navReport: "Report Problem",
    navMyComplaints: "My Complaints",
    navPublicProblems: "Public Issues & Map",
    navOfficerDashboard: "Officer Portal",
    navAdminDashboard: "Admin Portal",
    navFAQ: "Help & FAQ",
    navLogin: "Login",
    navRegister: "Register",
    navLogout: "Logout",
    languageToggle: "हिंदी",

    // Banner
    prototypeDisclaimer: "INDEPENDENT PROTOTYPE: This platform is an independent civic prototype and is not officially operated by the Government of India or municipal entities. Authority assignments and status updates are simulations.",

    // Landing Page
    heroTitle: "Empowering Citizens, Connecting Civic Authorities",
    heroSubtitle: "Report public issues like potholes, streetlights, or garbage overflow in seconds. Our smart engine routes your report to the right configured office and groups shared community problems for faster collective action.",
    btnReportNow: "Report a Problem",
    btnExploreMap: "Explore Public Issues",
    howItWorksTitle: "How Jan Seva Works",
    step1Title: "1. Report Easily",
    step1Desc: "Pin the location on the map, describe the issue, and optionally upload photo evidence.",
    step2Title: "2. Smart Routing",
    step2Desc: "Our rules engine routes your report to the exact configured department and zonal office responsible.",
    step3Title: "3. Grouping & Deduplication",
    step3Desc: "Multiple reports for the same civic issue are linked into a single Common Problem without losing your individual report.",
    step4Title: "4. Track Transparently",
    step4Desc: "Follow verifiable progress from receipt to resolution on an immutable chronological timeline.",

    // Dashboard
    citizenDashboardTitle: "Citizen Civic Dashboard",
    totalSubmitted: "Total Reports",
    underReview: "Under Review",
    inProgress: "In Progress",
    resolved: "Resolved",
    recentReports: "Your Recent Complaints",
    noComplaintsYet: "You haven't submitted any civic complaints yet.",

    // Submit
    submitComplaintTitle: "Report a Civic Problem",
    submitSubtitle: "Provide accurate details to ensure prompt evaluation and routing.",
    labelTitle: "Problem Title",
    labelCategory: "Problem Category",
    labelDescription: "Detailed Description",
    labelLocality: "Locality / Street Landmark",
    labelCity: "City / Municipality",
    labelWard: "Ward / Zone (Optional for auto-routing)",
    labelPinLocation: "Pin Location on Map",
    labelEvidence: "Photo Evidence (Optional)",
    privacyNotice: "Privacy Notice: Your personal phone number, email, and exact residence will NEVER be shown on public issue pages.",
    btnSubmitComplaint: "Submit Report",

    // Common
    loading: "Loading...",
    status: "Status",
    trackingId: "Tracking ID",
    category: "Category",
    date: "Reported Date",
    assignedOffice: "Assigned Office",
    actions: "Actions",
    viewDetails: "View Details",
    disputeAction: "Dispute Resolution",
    timelineTitle: "Chronological Status Timeline",
    reportCount: "Citizens Reported",
    filterByCategory: "All Categories",
  },
  hi: {
    // App & Header
    appName: "जन सेवा",
    appTagline: "नागरिक समस्या रिपोर्टिंग, स्मार्ट रूटिंग एवं समाधान मंच",
    prototypeBadge: "प्रोटोटाइप सिमुलेशन",
    navHome: "होम",
    navReport: "समस्या दर्ज करें",
    navMyComplaints: "मेरी शिकायतें",
    navPublicProblems: "सार्वजनिक समस्याएं व नक्शा",
    navOfficerDashboard: "अधिकारी पोर्टल",
    navAdminDashboard: "प्रशासक पोर्टल",
    navFAQ: "मदद व प्रश्न",
    navLogin: "लॉग इन",
    navRegister: "पंजीकरण",
    navLogout: "लॉग आउट",
    languageToggle: "English",

    // Banner
    prototypeDisclaimer: "स्वतंत्र प्रोटोटाइप सूचना: यह मंच एक स्वतंत्र नागरिक प्रोटोटाइप है और यह भारत सरकार या नगर निगम द्वारा आधिकारिक तौर पर संचालित नहीं है। सभी असाइनमेंट और अपडेट सिमुलेशन हैं।",

    // Landing Page
    heroTitle: "नागरिकों का सशक्तिकरण, समस्याओं का त्वरित समाधान",
    heroSubtitle: "सड़क के गड्ढे, टूटी स्ट्रीट लाइट या कचरे की समस्या कुछ ही सेकंड में दर्ज करें। हमारा स्मार्ट सिस्टम आपकी शिकायत सही विभाग तक पहुंचाता है और एक जैसी समस्याओं को सामूहिक समाधान के लिए जोड़ता है।",
    btnReportNow: "समस्या दर्ज करें",
    btnExploreMap: "सार्वजनिक नक्शा देखें",
    howItWorksTitle: "जन सेवा कैसे कार्य करता है",
    step1Title: "1. आसानी से रिपोर्ट करें",
    step1Desc: "नक्शे पर स्थान चुनें, समस्या का विवरण दें और फोटो साक्ष्य संलग्न करें।",
    step2Title: "2. स्मार्ट रूटिंग",
    step2Desc: "हमारा सिस्टम आपकी शिकायत को संबंधित विभाग और जोनल कार्यालय तक पहुंचाता है।",
    step3Title: "3. डुप्लीकेट पहचान व ग्रुपिंग",
    step3Desc: "एक ही समस्या की कई शिकायतों को सामूहिक रूप से जोड़ता है बिना आपकी व्यक्तिगत शिकायत खोए।",
    step4Title: "4. पारदर्शी ट्रैकिंग",
    step4Desc: "शिकायत दर्ज होने से लेकर समाधान तक हर चरण को समय-सीमा के साथ ट्रैक करें।",

    // Dashboard
    citizenDashboardTitle: "नागरिक समस्या डैशबोर्ड",
    totalSubmitted: "कुल शिकायतें",
    underReview: "समीक्षाधीन",
    inProgress: "प्रगति पर",
    resolved: "समाधानित",
    recentReports: "आपकी हालिया शिकायतें",
    noComplaintsYet: "आपने अभी तक कोई शिकायत दर्ज नहीं की है।",

    // Submit
    submitComplaintTitle: "नागरिक समस्या दर्ज करें",
    submitSubtitle: "सही विभाग को भेजने के लिए सटीक जानकारी और स्थान प्रदान करें।",
    labelTitle: "समस्या का शीर्षक",
    labelCategory: "समस्या की श्रेणी",
    labelDescription: "विस्तृत विवरण",
    labelLocality: "इलाका / सड़क का पता",
    labelCity: "शहर / नगर पालिका",
    labelWard: "वार्ड / जोन (स्वचालित रूटिंग हेतु)",
    labelPinLocation: "नक्शे पर स्थान चुनें",
    labelEvidence: "फोटो साक्ष्य (वैकल्पिक)",
    privacyNotice: "गोपनीयता सूचना: आपका फोन नंबर, ईमेल और सटीक घर का पता सार्वजनिक पेज पर कभी नहीं दिखाया जाएगा।",
    btnSubmitComplaint: "शिकायत दर्ज करें",

    // Common
    loading: "लोड हो रहा है...",
    status: "स्थिति",
    trackingId: "ट्रैकिंग क्रमांक",
    category: "श्रेणी",
    date: "दर्ज तिथि",
    assignedOffice: "नियुक्त कार्यालय",
    actions: "कार्रवाई",
    viewDetails: "विवरण देखें",
    disputeAction: "समाधान पर आपत्ति",
    timelineTitle: "समस्या की समय-सीमा (टाइमलाइन)",
    reportCount: "नागरिकों की संख्या",
    filterByCategory: "सभी श्रेणियां",
  }
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  language: "en",
  setLang: () => {},
  setLanguage: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("jan_seva_lang") as Language;
    if (saved && (saved === "en" || saved === "hi")) {
      setLang(saved);
    }
  }, []);

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("jan_seva_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key] || translations["en"][key] || key;
  };

  return (
    <I18nContext.Provider
      value={{
        lang,
        language: lang,
        setLang: changeLang,
        setLanguage: changeLang,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
export const useLanguage = () => useContext(I18nContext);
