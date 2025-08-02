"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-6">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      {/* Main content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 transition-all duration-1000 ease-out transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-12 max-w-4xl">
          <div className="mb-6 relative">
            <section className="text-center mt-20">
              <h2 className="text-3xl font-bold text-white">Welcome back 👋</h2>
              <p className="text-slate-300 mt-2">
                Track your internships below
              </p>
            </section>
          </div>

          <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Stay organized and on top of your internship applications with our
            powerful tracking system.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            {[
              {
                icon: "📊",
                title: "Track Progress",
                desc: "Monitor application status",
              },
              {
                icon: "⏰",
                title: "Stay Organized",
                desc: "Never miss deadlines",
              },
              {
                icon: "🎯",
                title: "Land Your Dream",
                desc: "Achieve your goals",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA section with frosted panel */}
        <div className="flex flex-col sm:flex-row gap-6 mb-12 bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
          <Link
            href="/add-job"
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:from-purple-500 hover:to-indigo-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            <span className="relative flex items-center gap-2">
              <span>Add New Internship</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                →
              </span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-2xl border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span>View Dashboard</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                📈
              </span>
            </span>
          </Link>
        </div>

        {/* Stats section */}
        <div className="flex flex-wrap justify-center gap-8 text-center">
          {[
            { value: "1000+", label: "Applications Tracked" },
            { value: "95%", label: "Success Rate" },
            { value: "24/7", label: "Available" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-6 py-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transform transition-all duration-300 hover:scale-105"
            >
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
