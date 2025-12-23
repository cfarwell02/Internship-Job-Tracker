"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [applicationsTracked, setApplicationsTracked] = useState(0);
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const total = snapshot.docs.length;
      const offers = snapshot.docs.filter(
        (doc) => doc.data().status === "Offer"
      ).length;

      setApplicationsTracked(total);
      setOffersCount(offers);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f1a30] to-[#0b1220] pt-24 px-6 text-white relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-20 w-96 h-96 bg-teal-500/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-10 w-80 h-80 bg-emerald-400/25 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-cyan-500/10 rounded-full blur-[110px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none z-0" />

      {/* Content */}
      <div
        className={`relative z-10 text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
          Internship Tracker
        </h2>
        <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Track applications, offers, and follow-ups with a streamlined, modern dashboard.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-14">
          <Link
            href="/add-job"
            className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-lg font-semibold rounded-xl shadow-md hover:scale-105 hover:from-teal-400 hover:to-emerald-400 transition-transform duration-300 text-slate-900"
          >
            ➕ Add New Internship
          </Link>
          <Link
            href="/dashboard"
            className="border border-white/15 px-6 py-3 text-lg font-semibold rounded-xl backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-transform duration-300 hover:scale-105"
          >
            📈 View Dashboard
          </Link>
        </div>

        {/* Preview stats */}
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { value: `${applicationsTracked}`, label: "Applications Tracked" },
            { value: `${offersCount}`, label: "Offers Received" },
            { value: "24/7", label: "Always Available" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-6 py-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl hover:bg-white/10 transition duration-300 hover:scale-105 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
            >
              <div className="text-2xl font-bold text-teal-300">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
