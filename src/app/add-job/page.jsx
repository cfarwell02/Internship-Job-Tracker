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

  // Assuming this is within your React component or page file
  // import { useState } from 'react'; // Make sure you have useState if using it for formData and loading states

  const extractJobData = async () => {
    if (!url.trim()) {
      alert("Please enter a job posting URL before extracting.");
      return;
    }
    setLoadingExtract(true); // <-- Start loading
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }), // Assuming 'url' is available in scope
      });

      if (!res.ok) {
        const errorResponse = await res
          .json()
          .catch(() => ({ error: "Unknown error" })); // Try to parse as JSON, fallback to generic error
        console.error("Server error:", errorResponse.error);
        // Instead of alert, set a state variable for UI display
        // alert("Job extraction failed. Server returned error: " + errorResponse.error);
        // Example: setError("Job extraction failed: " + errorResponse.error);
        throw new Error(
          errorResponse.error || "Job extraction failed. Server returned error."
        );
      }

      let responseJson;
      try {
        responseJson = await res.json();
      } catch (e) {
        const text = await res.text();
        console.error("⚠️ Unexpected non-JSON response from API:", text);
        // alert("Unexpected error from server. Check console for details.");
        // Example: setError("Unexpected error from server. Please check console.");
        throw new Error("Unexpected non-JSON response from server.");
      }

      // Now, responseJson.data is already the parsed job object.
      // No need for .replace() or JSON.parse() here.
      const parsedJobData = responseJson.data;

      setFormData((prev) => ({
        ...prev,
        company: parsedJobData.company || "Not provided",
        position: parsedJobData.title || "Not provided", // 'title' from AI maps to 'position' in your form
        location: parsedJobData.location || "Not provided",
        salary: parsedJobData.salary || "Not provided",
        notes: parsedJobData.description || "Not provided", // 'description' from AI maps to 'notes'
        job_type: parsedJobData.job_type || "Not provided",
        posted_date: parsedJobData.posted_date || "Not provided",
        benefits: parsedJobData.benefits || "Not provided",
        url: url || "Not provided", // Ensure 'url' is still in scope or passed correctly
      }));
      // Example: setError(null); // Clear any previous errors on success
    } catch (err) {
      console.error("❌ Failed to extract job details:", err);
      // alert("Could not extract job details.");
      // Example: setError("Could not extract job details. Please try again.");
    } finally {
      setLoadingExtract(false); // <-- End loading
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.status) {
      alert("Please select a status before submitting.");
      return;
    }
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
            disabled={!url.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 transition text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
            onInvalid={(e) =>
              e.target.setCustomValidity("Please select a status from the list.")
            }
            onInput={(e) => e.target.setCustomValidity("")}
            required
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
