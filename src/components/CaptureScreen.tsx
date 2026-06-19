"use client";

import { useState, useRef } from "react";

interface LeadData {
  name: string;
  phone: string;
  email: string;
  company: string;
  designation: string;
  website: string;
  address: string;
  notes: string;
}

const emptyLead: LeadData = {
  name: "",
  phone: "",
  email: "",
  company: "",
  designation: "",
  website: "",
  address: "",
  notes: "",
};

type Status = "idle" | "processing" | "review" | "saving" | "success" | "error";

export default function CaptureScreen() {
  const [status, setStatus] = useState<Status>("idle");
  const [lead, setLead] = useState<LeadData>(emptyLead);
  const [imageData, setImageData] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function processImage(base64: string) {
    setStatus("processing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `OCR failed (${res.status})`);

      setLead({ ...emptyLead, ...data });
      setStatus("review");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(`Error: ${msg}`);
      setLead(emptyLead);
      setStatus("review");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageData(result);
      const base64 = result.split(",")[1];
      processImage(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function updateField(field: keyof LeadData, value: string) {
    setLead((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!lead.name && !lead.phone && !lead.email) {
      setErrorMsg("At least fill Name, Phone, or Email");
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead, image: imageData }),
      });

      if (!res.ok) throw new Error("Save failed");
      setStatus("success");
    } catch {
      setErrorMsg("Failed to save. Check your connection and try again.");
      setStatus("review");
    }
  }

  function reset() {
    setLead(emptyLead);
    setImageData(null);
    setStatus("idle");
    setErrorMsg("");
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Lead Saved!</h2>
          <p className="text-slate-400 mb-6">{lead.name || "Contact"} added to Google Sheet</p>
          <button onClick={reset} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition">
            Capture Next Card
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-lg font-bold">📇 Card Capture</h1>
        {status !== "idle" && (
          <button onClick={reset} className="text-sm text-slate-400 hover:text-white">
            Reset
          </button>
        )}
      </header>

      {/* Capture area */}
      {status === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <p className="text-slate-400 text-center mb-4">Take a photo or upload a visiting card</p>
          <p className="text-xs text-slate-600 mb-2">v2.1 — Claude Vision</p>

          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
          >
            📸 Take Photo
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-xs py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition flex items-center justify-center gap-2 border border-slate-700"
          >
            🖼️ Upload from Gallery
          </button>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          <button
            onClick={() => { setStatus("review"); }}
            className="text-sm text-slate-500 hover:text-slate-300 mt-4"
          >
            or enter details manually
          </button>
        </div>
      )}

      {/* Processing */}
      {status === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
          <p className="text-slate-400">Reading card...</p>
        </div>
      )}

      {/* Review form */}
      {(status === "review" || status === "saving") && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {imageData && (
            <div className="mb-4 rounded-xl overflow-hidden border border-slate-700">
              <img src={imageData} alt="Card" className="w-full h-auto max-h-48 object-contain bg-slate-900" />
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3">
            {(Object.keys(emptyLead) as (keyof LeadData)[]).map((field) => (
              <div key={field}>
                <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">
                  {field === "phone" ? "Mobile" : field}
                </label>
                {field === "address" || field === "notes" ? (
                  <textarea
                    value={lead[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={field === "email" ? "email" : field === "phone" ? "tel" : field === "website" ? "url" : "text"}
                    value={lead[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="w-full mt-6 mb-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-semibold text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === "saving" ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              "💾 Save to Google Sheet"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
