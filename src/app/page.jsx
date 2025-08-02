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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 px-6 text-white relative overflow-hidden">
      {/* Blobs background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse delay-500" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-500 rounded-full mix-blend-multiply blur-3xl opacity-10 animate-pulse delay-700" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none z-0" />

      {/* Content */}
      <div
        className={`relative z-10 text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          Internship Tracker
        </h2>
        <p className="text-lg sm:text-xl text-slate-300 mb-10">
          Stay on top of your internship applications — all in one place.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-14">
          <Link
            href="/add-job"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-lg font-semibold rounded-xl shadow-md hover:scale-105 hover:from-purple-500 hover:to-indigo-500 transition-transform duration-300"
          >
            ➕ Add New Internship
          </Link>
          <Link
            href="/dashboard"
            className="border border-white/20 px-6 py-3 text-lg font-semibold rounded-xl backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-transform duration-300 hover:scale-105"
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
              className="px-6 py-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl hover:bg-white/10 transition duration-300 hover:scale-105"
            >
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
