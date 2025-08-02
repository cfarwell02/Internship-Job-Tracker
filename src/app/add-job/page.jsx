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
    setLoadingExtract(true); // <-- Start loading
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error:", errorText);
        throw new Error("Job extraction failed. Server returned error.");
      }

      let json;
      try {
        json = await res.json();
      } catch (e) {
        const text = await res.text();
        console.error("⚠️ Unexpected non-JSON response:", text);
        alert("Unexpected error from server. Check console for details.");
        return;
      }

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
    } finally {
      setLoadingExtract(false); // <-- End loading
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
      setFormData({
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
        contact: "",
      });

      alert("Internship saved successfully!");
    } catch (err) {
      console.error("Error adding job:", err);
      alert("Failed to add job.");
    }
  };

  return (
    <main className="min-h-screen py-10 bg-slate-900 text-white pt-20 px-6">
      <div className="max-w-3xl mx-auto bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700">
        <h2 className="text-3xl font-bold mb-6">📋 Internship Details</h2>

        <div className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            placeholder="Paste job posting URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input w-full"
          />
          <button
            onClick={extractJobData}
            className="bg-emerald-600 hover:bg-emerald-500 transition text-white px-4 py-2 rounded"
          >
            {loadingExtract ? "Extracting..." : "Extract with AI"}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input
            name="company"
            placeholder="Company"
            value={formData.company}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            name="position"
            placeholder="Position"
            value={formData.position}
            onChange={handleChange}
            className="input"
            required
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
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
            className="input"
          />
          <input
            name="salary"
            placeholder="Salary"
            value={formData.salary}
            onChange={handleChange}
            className="input"
          />
          <input
            name="contact"
            placeholder="Contact Info"
            value={formData.contact}
            onChange={handleChange}
            className="input"
          />
          <input
            name="job_type"
            placeholder="Job Type"
            value={formData.job_type}
            onChange={handleChange}
            className="input"
          />
          <input
            name="posted_date"
            placeholder="Date Posted"
            value={formData.posted_date}
            onChange={handleChange}
            className="input"
          />
          <input
            name="benefits"
            placeholder="Benefits"
            value={formData.benefits}
            onChange={handleChange}
            className="input"
          />

          <input
            name="url"
            placeholder="Original Job URL"
            value={formData.url}
            onChange={handleChange}
            className="input col-span-full"
          />

          <textarea
            name="notes"
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={handleChange}
            className="input col-span-full min-h-[120px]"
          />

          <button
            type="submit"
            className="col-span-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded transition"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}
