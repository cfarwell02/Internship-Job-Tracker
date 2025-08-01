"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function JobDetailPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    location: "",
    salary: "",
    status: "",
    notes: "",
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const docRef = doc(db, "jobs", jobId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setJob({ id: docSnap.id, ...data });
          setFormData({
            company: data.company || "",
            position: data.position || "",
            status: data.status || "",
            notes: data.notes || "",
          });
        } else {
          setJob(null);
        }
      } catch (err) {
        console.error("Error loading job:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, "jobs", jobId);
      await updateDoc(docRef, formData);
      setEditing(false);
      setJob((prev) => ({ ...prev, ...formData }));
    } catch (err) {
      console.error("Failed to update job:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const docRef = doc(db, "jobs", jobId);
      await deleteDoc(docRef);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  if (loading) return <p style={styles.container}>Loading...</p>;
  if (!job) return <p style={styles.container}>❌ Job not found</p>;

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>
        🔍 {editing ? "Edit Internship" : job.company}
      </h1>

      {editing ? (
        <>
          <input
            name="company"
            value={formData.company}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            name="position"
            value={formData.position}
            onChange={handleChange}
            style={styles.input}
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.input}
          >
            <option>Applied</option>
            <option>Interviewing</option>
            <option>Offer</option>
            <option>Rejected</option>
          </select>

          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="salary"
            placeholder="Salary"
            value={formData.salary}
            onChange={handleChange}
            style={styles.input}
          />

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            style={styles.textarea}
          />
          <button onClick={handleSave} style={styles.button}>
            💾 Save
          </button>
        </>
      ) : (
        <>
          <p>
            <strong>Position:</strong> {job.position}
          </p>
          <p>
            <strong>Status:</strong> {job.status}
          </p>
          <p>
            <strong>Date Applied:</strong>{" "}
            {job.dateApplied?.toDate?.().toLocaleDateString?.() ?? "N/A"}
          </p>
          <p>
            <strong>Notes:</strong> {job.notes || "None"}
          </p>
          {job.url && (
            <p>
              <strong>Original Posting:</strong>{" "}
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0070f3", textDecoration: "underline" }}
              >
                View Job ↗
              </a>
            </p>
          )}

          <div style={styles.actions}>
            <button onClick={() => setEditing(true)} style={styles.button}>
              ✏️ Edit
            </button>
            <button onClick={handleDelete} style={styles.deleteButton}>
              🗑️ Delete
            </button>
          </div>
        </>
      )}
    </main>
  );
}

const textColor = "#1a1a1a";

const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
    maxWidth: "800px",
    margin: "0 auto",
    color: textColor,
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    color: textColor,
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    marginBottom: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    color: textColor,
    transition: "border 0.2s ease",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginBottom: "1rem",
    color: textColor,
    minHeight: "100px",
  },
  button: {
    padding: "0.75rem 1.25rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    marginRight: "1rem",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  deleteButton: {
    padding: "0.75rem 1.25rem",
    backgroundColor: "#ff4d4d",
    color: "#fff",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  actions: {
    marginTop: "1.5rem",
  },
};
