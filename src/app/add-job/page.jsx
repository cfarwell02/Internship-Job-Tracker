"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AddJobPage() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [loadingExtract, setLoadingExtract] = useState(false);

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "",
    location: "",
    salary: "",
    notes: "",
    job_type: "",
    posted_date: "",
    benefits: "",
    url: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const extractJobData = async () => {
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      // You can then parse and use it:
      const cleaned = json.data
        .replace(/^```json/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      setFormData((prev) => ({
        ...prev,
        company: parsed.company || "Not provided",
        position: parsed.title || "Not provided",
        location: parsed.location || "Not provided",
        salary: parsed.salary || "Not provided",
        notes: parsed.description || "Not provided",
        job_type: parsed.job_type || "Not provided",
        posted_date: parsed.posted_date || "Not provided",
        benefits: parsed.benefits || "Not provided",
        url: url || "Not provided",
      }));
    } catch (err) {
      console.error("❌ Failed to parse AI response:", err);
      alert("Could not extract job details.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "jobs"), {
        ...formData,
        url: formData.url,
        dateApplied: Timestamp.now(),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Error adding job:", err);
      alert("Failed to add job.");
    }
  };

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📋 Internship Details</h2>

        <div style={styles.extractSection}>
          <input
            type="text"
            placeholder="Paste job posting URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={(styles.inputFull, styles.input)}
          />
          <button
            onClick={extractJobData}
            style={{ ...styles.button, ...styles.extractButton }}
          >
            {loadingExtract ? "Extracting..." : "Extract with AI"}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            name="company"
            placeholder="Company"
            value={formData.company}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="position"
            placeholder="Position"
            value={formData.position}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="" disabled>
              Select status
            </option>
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
          <input
            name="contact"
            placeholder="Contact Info"
            value={formData.contact}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            name="job_type"
            placeholder="Job Type"
            value={formData.job_type}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            name="posted_date"
            placeholder="Date Posted"
            value={formData.posted_date}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            name="benefits"
            placeholder="Benefits"
            value={formData.benefits}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            name="url"
            placeholder="Original Job URL"
            value={formData.url}
            onChange={handleChange}
            style={(styles.inputFull, styles.input)}
          />
          <textarea
            name="notes"
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={handleChange}
            style={styles.textarea}
          />
          <button
            type="submit"
            style={{
              ...styles.button,
              ...styles.submitButton,
            }}
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}

const styles = {
  main: {
    padding: "2rem",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    maxWidth: "700px",
    margin: "0 auto",
    border: "1px solid #eee",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#333",
  },
  extractSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "2rem",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    transition: "border 0.2s ease",
    color: "#1a1a1a",
  },
  inputFull: {
    gridColumn: "span 2",
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  textarea: {
    gridColumn: "span 2",
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    minHeight: "100px",
    color: "#1a1a1a",
  },
  button: {
    padding: "0.75rem",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
  },
  extractButton: {
    backgroundColor: "#10b981", // green
  },
  submitButton: {
    backgroundColor: "#0070f3",
    gridColumn: "span 2",
  },
};
