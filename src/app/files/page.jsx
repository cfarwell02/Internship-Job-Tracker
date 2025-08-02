"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";

export default function FileVaultPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState("Resume");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState([]);

  // Load files from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("fileVault");
    if (saved) {
      setFiles(JSON.parse(saved));
    }
  }, []);

  const saveToLocal = (data) => {
    localStorage.setItem("fileVault", JSON.stringify(data));
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileData = {
        id: Date.now(),
        fileName: selectedFile.name,
        fileType,
        tags: tags.split(",").map((t) => t.trim()),
        base64: reader.result,
        createdAt: new Date().toISOString(),
      };

      const newFiles = [...files, fileData];
      setFiles(newFiles);
      saveToLocal(newFiles);
      toast.success("✅ File saved!");

      // Reset UI
      setSelectedFile(null);
      setTags("");
      setFileType("Resume");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = async (id) => {
    const fileToDelete = files.find((f) => f.id === id);
    const confirmed = confirm(
      `Are you sure you want to delete "${fileToDelete?.fileName}"?`
    );

    if (!confirmed) return;

    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    saveToLocal(updated);
    toast("🗑️ File deleted");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => setSelectedFile(accepted[0]),
  });

  return (
    <main className="min-h-screen px-6 py-10 bg-slate-900 text-white pt-20">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6">📁 My Files</h1>

      <div className="mb-8 bg-slate-800 p-6 rounded-xl border border-slate-700">
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className="mb-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer bg-slate-700 hover:bg-slate-600 transition"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag and drop a file here, or click to select</p>
            )}
          </div>
        ) : (
          <div className="mb-4 p-4 bg-slate-700 rounded-md text-sm">
            <p>
              <strong>File:</strong> {selectedFile.name}
            </p>
            <p>
              <strong>Type:</strong> {fileType}
            </p>
            <p>
              <strong>Tags:</strong> {tags || "None"}
            </p>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-400 text-xs mt-2 hover:underline"
            >
              Cancel Upload
            </button>
          </div>
        )}

        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="mb-4"
        >
          <option>Resume</option>
          <option>Cover Letter</option>
          <option>Transcript</option>
          <option>Other</option>
        </select>

        <input
          type="text"
          placeholder="Tags (e.g. Summer 2025, NYC)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mb-4 w-full"
        />

        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 transition"
        >
          Save File
        </button>
      </div>

      {files.length === 0 ? (
        <p className="text-slate-400">No files saved yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700"
            >
              <p className="font-medium">{file.fileName}</p>
              <p className="text-sm text-slate-400">{file.fileType}</p>
              {file.tags?.length > 0 && (
                <p className="text-xs text-slate-500">
                  Tags: {file.tags.join(", ")}
                </p>
              )}
              <a
                href={file.base64}
                download={file.fileName}
                className="text-indigo-400 hover:text-indigo-300 text-sm block mt-1"
              >
                View/Download ↗
              </a>
              <button
                onClick={() => handleDelete(file.id)}
                className="text-red-400 hover:text-red-300 text-sm mt-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
