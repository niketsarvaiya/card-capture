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

const fieldMeta: Record<keyof LeadData, { label: string; icon: string; type: string }> = {
  name: { label: "Full Name", icon: "👤", type: "text" },
  phone: { label: "Mobile", icon: "📱", type: "tel" },
  email: { label: "Email", icon: "✉️", type: "email" },
  company: { label: "Company", icon: "🏢", type: "text" },
  designation: { label: "Designation", icon: "💼", type: "text" },
  website: { label: "Website", icon: "🌐", type: "url" },
  address: { label: "Address", icon: "📍", type: "textarea" },
  notes: { label: "Notes", icon: "📝", type: "textarea" },
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
      setErrorMsg("Please fill at least Name, Phone, or Email");
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

  // ─── Success Screen ───
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <div className="text-center animate-scale-in">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-[pulse-ring_1.5s_ease-out_infinite]" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-1">Lead Saved!</h2>
          <p className="text-gray-400 mb-8 text-sm">
            {lead.name || "Contact"} added to your sheet
          </p>
          <button
            onClick={reset}
            className="btn-press px-10 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-500/25 transition-all"
          >
            Scan Next Card
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Screen ───
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">
            ⚡
          </div>
          <h1 className="text-lg font-bold tracking-tight">Card Capture</h1>
        </div>
        {status !== "idle" && (
          <button
            onClick={reset}
            className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            Reset
          </button>
        )}
      </header>

      {/* ─── Idle / Capture ─── */}
      {status === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          {/* Hero graphic */}
          <div className="animate-fade-in-up mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl" />
              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                <span className="text-5xl animate-[bounce-subtle_3s_ease-in-out_infinite]">📇</span>
              </div>
            </div>
          </div>

          <h2 className="animate-fade-in-up stagger-1 text-xl font-semibold mb-1.5 text-center">
            Scan a Visiting Card
          </h2>
          <p className="animate-fade-in-up stagger-2 text-gray-500 text-sm text-center mb-10 max-w-[260px]">
            Capture or upload a business card and we&apos;ll extract all the details instantly
          </p>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="animate-fade-in-up stagger-3 btn-press w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 rounded-2xl font-semibold text-base shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Take Photo
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="animate-fade-in-up stagger-4 btn-press w-full py-4 rounded-2xl font-semibold text-base border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2.5 text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              Upload from Gallery
            </button>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>

          <button
            onClick={() => setStatus("review")}
            className="animate-fade-in-up stagger-5 mt-6 text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            or enter manually
          </button>

          <p className="animate-fade-in stagger-6 text-[10px] text-gray-700 mt-auto pt-8">
            Built by Niket · Powered by Claude AI
          </p>
        </div>
      )}

      {/* ─── Processing ─── */}
      {status === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="animate-scale-in">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-[pulse-ring_2s_ease-out_infinite]" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-indigo-400 border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
              </div>
            </div>
          </div>
          <p className="text-gray-300 font-medium animate-fade-in">Reading card...</p>
          <p className="text-gray-600 text-sm mt-1 animate-fade-in stagger-1">AI is extracting details</p>
          <div className="mt-6 w-48 h-1 rounded-full bg-gray-800 overflow-hidden animate-fade-in stagger-2">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shimmer-bg" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* ─── Review Form ─── */}
      {(status === "review" || status === "saving") && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5">
            {/* Card preview */}
            {imageData && (
              <div className="animate-fade-in-up mb-5 rounded-2xl overflow-hidden gradient-border">
                <img src={imageData} alt="Card" className="w-full h-auto max-h-44 object-contain bg-gray-900/50 p-2" />
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="animate-slide-down mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                <span className="text-red-400 text-sm mt-0.5">⚠️</span>
                <p className="text-red-300 text-sm leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Section label */}
            <div className="flex items-center gap-2 mb-4 animate-fade-in">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">Contact Details</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {(Object.keys(emptyLead) as (keyof LeadData)[]).map((field, i) => {
                const meta = fieldMeta[field];
                const isTextarea = meta.type === "textarea";
                return (
                  <div key={field} className={`animate-fade-in-up stagger-${i + 1}`}>
                    <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5 pl-1">
                      <span className="text-xs">{meta.icon}</span>
                      {meta.label}
                    </label>
                    <div className="input-glow rounded-xl transition-all">
                      {isTextarea ? (
                        <textarea
                          value={lead[field]}
                          onChange={(e) => updateField(field, e.target.value)}
                          rows={2}
                          placeholder={`Enter ${meta.label.toLowerCase()}`}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                        />
                      ) : (
                        <input
                          type={meta.type}
                          value={lead[field]}
                          onChange={(e) => updateField(field, e.target.value)}
                          placeholder={`Enter ${meta.label.toLowerCase()}`}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={status === "saving"}
              className="btn-press w-full mt-8 mb-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-2xl font-semibold text-base shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2.5"
            >
              {status === "saving" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Save to Google Sheet
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
