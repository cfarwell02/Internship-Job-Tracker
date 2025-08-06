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
            location: data.location || "",
            salary: data.salary || "",
            notes: data.notes || "",
            job_type: data.job_type || "",
            posted_date: data.posted_date || "",
            benefits: data.benefits || "",
            url: data.url || "",
            contact: data.contact || "",
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

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!job)
    return <p className="text-center py-10 text-red-500">❌ Job not found</p>;

  return (
    <main className="min-h-screen bg-slate-900 text-white px-6 py-10 pt-20">
      <div className="max-w-2xl mx-auto bg-slate-800 p-6 rounded-xl border border-slate-700 shadow">
        <h1 className="text-3xl font-bold mb-6">
          🔍 {editing ? "Edit Internship" : job.company}
        </h1>

        {editing ? (
          <>
            <input
              name="company"
              placeholder="Company Name"
              value={formData.company}
              onChange={handleChange}
              className="input mb-4 w-full"
            />
            <input
              name="position"
              placeholder="Position Title"
              value={formData.position}
              onChange={handleChange}
              className="input mb-4 w-full"
            />
            <select
              name="status"
              placeholder="Status"
              value={formData.status}
              onChange={handleChange}
              className="input mb-4 w-full"
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
              className="input mb-4 w-full"
            />
            <input
              name="salary"
              placeholder="Salary"
              value={formData.salary}
              onChange={handleChange}
              className="input mb-4 w-full"
            />
            <input
              name="contact"
              placeholder="Contact"
              value={formData.contact}
              onChange={handleChange}
              className="input mb-4 w-full"
            />
            <input
              name="posted_date"
              placeholder="Date Posted"
              value={formData.posted_date}
              onChange={handleChange}
              className="input mb-4 w-full"
            />

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input mb-4 w-full min-h-[120px]"
            />
            <button onClick={handleSave} className="button">
              💾 Save
            </button>
          </>
        ) : (
          <>
            <p>
              <strong>Company:</strong> {job.company || "N/A"}
            </p>
            <p>
              <strong>Position:</strong> {job.position || "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {job.status || "N/A"}
            </p>
            <p>
              <strong>Location:</strong> {job.location || "N/A"}
            </p>
            <p>
              <strong>Salary:</strong> {job.salary || "N/A"}
            </p>
            <p>
              <strong>Job Type:</strong> {job.job_type || "N/A"}
            </p>
            <p>
              <strong>Posted Date:</strong> {job.posted_date || "N/A"}
            </p>
            <p>
              <strong>Benefits:</strong> {job.benefits || "N/A"}
            </p>
            <p>
              <strong>Contact Info:</strong> {job.contact || "N/A"}
            </p>
            <p>
              <strong>Notes:</strong> {job.notes || "None"}
            </p>
            <p>
              <strong>Date Applied:</strong>{" "}
              {job.dateApplied?.toDate?.().toLocaleDateString?.() ?? "N/A"}
            </p>
            {job.url && (
              <p>
                <strong>Original Posting:</strong>{" "}
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-indigo-400 hover:text-indigo-300"
                >
                  View Job ↗
                </a>
              </p>
            )}

            <div className="mt-6 flex gap-4">
              <button onClick={() => setEditing(true)} className="button">
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition"
              >
                🗑️ Delete
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
