"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function DashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jobs"));
        const jobsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setJobs(jobsList);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <main className="min-h-screen py-12 px-4 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        📊 Internship Dashboard
      </h1>

      {loading ? (
        <p className="text-center text-slate-400">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="text-center text-slate-400">No jobs found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link key={job.id} href={`/${job.id}`}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition duration-300 cursor-pointer shadow-md hover:shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {job.company}
                </h3>
                <p className="text-slate-300 text-sm">
                  <strong className="text-white">Position:</strong>{" "}
                  {job.position}
                </p>
                <p className="text-slate-300 text-sm">
                  <strong className="text-white">Status:</strong> {job.status}
                </p>
                <p className="text-slate-300 text-sm">
                  <strong className="text-white">Applied on:</strong>{" "}
                  {job.dateApplied?.toDate?.().toLocaleDateString?.() ?? "N/A"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
