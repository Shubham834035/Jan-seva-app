"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  HelpCircle, ChevronDown, ChevronUp, ShieldCheck, 
  GitFork, Layers, RefreshCw, AlertTriangle, ArrowRight, BookOpen 
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import PrototypeNoticeBanner from "@/components/PrototypeNoticeBanner";

interface FAQItem {
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
  category: "prototype" | "routing" | "duplicates" | "privacy" | "disputes";
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "prototype",
    questionEn: "Is Jan Seva an official Indian government portal?",
    questionHi: "क्या जन सेवा एक आधिकारिक भारत सरकार का पोर्टल है?",
    answerEn:
      "No. Jan Seva is an independent startup prototype and research demonstration. It is not affiliated with, endorsed by, or operated by any government ministry or municipal corporation. All municipal bodies, officers, and departments displayed during development are simulated test entities.",
    answerHi:
      "नहीं। जन सेवा एक स्वतंत्र स्टार्टअप प्रोटोटाइप और अनुसंधान प्रदर्शन है। यह किसी भी सरकारी मंत्रालय या नगर निगम से संबद्ध, समर्थित या संचालित नहीं है। विकास के दौरान प्रदर्शित सभी नगर निकाय, अधिकारी और विभाग सिम्युलेटेड परीक्षण इकाइयाँ हैं।",
  },
  {
    category: "routing",
    questionEn: "How does the Smart Authority Routing Engine work?",
    questionHi: "स्मार्ट प्राधिकरण रूटिंग इंजन कैसे काम करता है?",
    answerEn:
      "When a citizen submits a complaint, Jan Seva analyzes the issue category (e.g. damaged road, sewage overflow) and the geographic area (ward, municipality). It evaluates configured jurisdictional rules to propose or route the issue to the appropriate department and office. If the boundary or asset ownership is ambiguous, the complaint is placed into the 'Uncertain Routing Queue' for administrator review.",
    answerHi:
      "जब कोई नागरिक शिकायत दर्ज करता है, तो जन सेवा समस्या श्रेणी (उदा. टूटी सड़क, सीवेज ओवरफ्लो) और भौगोलिक क्षेत्र (वार्ड, नगर पालिका) का विश्लेषण करता है। यह उपयुक्त विभाग और कार्यालय को समस्या प्रस्तावित या रूट करने के लिए कॉन्फ़िगर किए गए अधिकार क्षेत्र के नियमों का मूल्यांकन करता है। यदि सीमा या संपत्ति का स्वामित्व अस्पष्ट है, तो शिकायत को व्यवस्थापक समीक्षा के लिए 'अनिश्चित रूटिंग कतार' में रखा जाता है।",
  },
  {
    category: "duplicates",
    questionEn: "What happens when multiple people report the same problem?",
    questionHi: "जब कई लोग एक ही समस्या की रिपोर्ट करते हैं तो क्या होता है?",
    answerEn:
      "Jan Seva groups related complaints into a shared 'Common Problem' hotspot without merging or deleting any citizen's individual complaint record. Our deterministic multi-factor engine compares geographic distance (Haversine formula within 350 meters), lexical token overlap, and recency. Individual citizens retain their own tracking numbers, status histories, and dispute rights.",
    answerHi:
      "जन सेवा किसी भी नागरिक के व्यक्तिगत शिकायत रिकॉर्ड को मर्ज या हटाए बिना संबंधित शिकायतों को एक साझा 'सामान्य समस्या' हॉटस्पॉट में समूहित करता है। हमारा बहु-कारक इंजन भौगोलिक दूरी (350 मीटर के भीतर हैवर्सिन फॉर्मूला), शाब्दिक समानता और नवीनता की तुलना करता है। प्रत्येक नागरिक अपना ट्रैकिंग नंबर, स्थिति इतिहास और विवाद अधिकार बरकरार रखता है।",
  },
  {
    category: "privacy",
    questionEn: "Is my personal information exposed on public problem pages?",
    questionHi: "क्या मेरी व्यक्तिगत जानकारी सार्वजनिक समस्या पृष्ठों पर दिखाई देती है?",
    answerEn:
      "No. Privacy is guaranteed by default. Public problem pages only display the generalized issue title, category, neighborhood name, and rounded geographic coordinates. Your full name, mobile number, and exact home coordinates are strictly protected and never displayed publicly.",
    answerHi:
      "नहीं। गोपनीयता डिफ़ॉल्ट रूप से सुरक्षित है। सार्वजनिक समस्या पृष्ठ केवल सामान्यीकृत समस्या शीर्षक, श्रेणी, मोहल्ले का नाम और अनुमानित भौगोलिक निर्देशांक प्रदर्शित करते हैं। आपका पूरा नाम, मोबाइल नंबर और सटीक घर का पता कभी भी सार्वजनिक रूप से प्रदर्शित नहीं किया जाता है।",
  },
  {
    category: "disputes",
    questionEn: "Can I dispute or reopen a complaint if it was improperly resolved?",
    questionHi: "यदि किसी शिकायत का गलत तरीके से समाधान किया गया है तो क्या मैं विवाद दर्ज कर सकता हूँ?",
    answerEn:
      "Yes. If an authority marks your complaint as 'Resolved' or 'Rejected', but the physical problem remains unaddressed on the ground, you can click 'Dispute Resolution' from your complaint tracking page, provide detailed notes, and request a review.",
    answerHi:
      "हाँ। यदि कोई प्राधिकारी आपकी शिकायत को 'हल' या 'अस्वीकृत' के रूप में चिह्नित करता है, लेकिन जमीन पर भौतिक समस्या अनसुलझी रहती है, तो आप अपने शिकायत ट्रैकिंग पृष्ठ से 'विवाद समाधान' पर क्लिक कर सकते हैं, विस्तृत विवरण प्रदान कर सकते हैं और समीक्षा का अनुरोध कर सकते हैं।",
  },
  {
    category: "prototype",
    questionEn: "What demo credentials can I use to test different roles?",
    questionHi: "विभिन्न भूमिकाओं का परीक्षण करने के लिए मैं किन डेमो क्रेडेंशियल का उपयोग कर सकता हूँ?",
    answerEn:
      "You can log in instantly using the pre-seeded demo buttons on the Login page: Citizen (rajesh@example.com / demo12345), PWD Officer (officer.pwd@mayanagari.gov.demo / demo12345), Waste Management Officer (officer.waste@mayanagari.gov.demo / demo12345), or Platform Admin (admin@janseva.org.demo / demo12345).",
    answerHi:
      "आप लॉगिन पृष्ठ पर दिए गए पूर्व-कॉन्फ़िगर डेमो बटन का उपयोग करके तुरंत लॉगिन कर सकते हैं: नागरिक (rajesh@example.com / demo12345), पीडब्ल्यूडी अधिकारी (officer.pwd@mayanagari.gov.demo / demo12345), स्वच्छता अधिकारी (officer.waste@mayanagari.gov.demo / demo12345), या प्लेटफ़ॉर्म व्यवस्थापक (admin@janseva.org.demo / demo12345)।",
  },
];

export default function FAQPage() {
  const { t, language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredFaqs = FAQ_DATA.filter((item) => {
    if (filterCategory === "all") return true;
    return item.category === filterCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* FAQ Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{language === "hi" ? "सहायता व अक्सर पूछे जाने वाले प्रश्न" : "Knowledge Base & FAQs"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {language === "hi" ? "जन सेवा कैसे काम करता है?" : "How Jan Seva Works"}
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            {language === "hi"
              ? "स्मार्ट रूटिंग, हॉटस्पॉट समूह, नागरिक गोपनीयता और प्रोटोटाइप कार्यप्रणाली से संबंधित सभी प्रश्नों के उत्तर।"
              : "Learn how our smart routing engine, common problem aggregation, and privacy safeguards work."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <PrototypeNoticeBanner />

        {/* Category Pills */}
        <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory("all")}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
              filterCategory === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {language === "hi" ? "सभी प्रश्न" : "All Questions"}
          </button>
          <button
            onClick={() => setFilterCategory("prototype")}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
              filterCategory === "prototype"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {language === "hi" ? "प्रोटोटाइप व सिमुलेशन" : "Prototype Disclosure"}
          </button>
          <button
            onClick={() => setFilterCategory("routing")}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
              filterCategory === "routing"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {language === "hi" ? "स्मार्ट रूटिंग" : "Smart Routing"}
          </button>
          <button
            onClick={() => setFilterCategory("duplicates")}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
              filterCategory === "duplicates"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {language === "hi" ? "हॉटस्पॉट समूहीकरण" : "Hotspot Grouping"}
          </button>
          <button
            onClick={() => setFilterCategory("privacy")}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
              filterCategory === "privacy"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {language === "hi" ? "गोपनीयता सुरक्षा" : "Privacy Safeguards"}
          </button>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-8 space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-900 leading-snug">
                    {language === "hi" ? faq.questionHi : faq.questionEn}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
                    {language === "hi" ? faq.answerHi : faq.answerEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Box */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-lg">
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {language === "hi" ? "क्या आपको कोई सार्वजनिक समस्या रिपोर्ट करनी है?" : "Ready to Report a Public Problem?"}
          </h2>
          <p className="mt-2 text-blue-100 text-xs sm:text-sm max-w-xl mx-auto">
            {language === "hi"
              ? "पॉटहोल, टूटी स्ट्रीटलाइट, सीवेज या कचरे की रिपोर्ट सेकंडों में दर्ज करें।"
              : "Submit civic grievances with photo evidence and map coordinates in seconds."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/submit"
              className="px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-md transition-colors inline-flex items-center gap-2"
            >
              <span>{language === "hi" ? "समस्या दर्ज करें" : "Report a Problem"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
