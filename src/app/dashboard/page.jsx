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
    <main style={styles.main}>
      <h1 style={styles.title}>Internship Dashboard</h1>

      {loading ? (
        <p style={styles.infoText}>Loading...</p>
      ) : jobs.length === 0 ? (
        <p style={styles.infoText}>No jobs found.</p>
      ) : (
        <div style={styles.list}>
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/${job.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>{job.company}</h3>
                <p>
                  <strong>Position:</strong> {job.position}
                </p>
                <p>
                  <strong>Status:</strong> {job.status}
                </p>
                <p>
                  <strong>Applied on:</strong>{" "}
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

const textColor = "#1a1a1a";

const styles = {
  main: {
    padding: "2rem",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    color: textColor,
  },
  infoText: {
    fontSize: "1.1rem",
    color: "#555",
    textAlign: "center",
    marginTop: "2rem",
  },
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    padding: "1.25rem",
    border: "1px solid #eee",
    borderRadius: "10px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.15s ease, box-shadow 0.2s ease",
    color: textColor,
  },
  cardTitle: {
    marginBottom: "0.5rem",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: textColor,
  },
};
