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

const fieldMeta: Record<keyof LeadData, { label: string; placeholder: string; type: string }> = {
  name: { label: "Name", placeholder: "Full name", type: "text" },
  phone: { label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
  email: { label: "Email", placeholder: "name@company.com", type: "email" },
  company: { label: "Company", placeholder: "Company name", type: "text" },
  designation: { label: "Title", placeholder: "Designation / Role", type: "text" },
  website: { label: "Website", placeholder: "www.example.com", type: "url" },
  address: { label: "Address", placeholder: "Office address", type: "textarea" },
  notes: { label: "Notes", placeholder: "Met at booth, interested in...", type: "textarea" },
};

type Status = "idle" | "processing" | "review" | "saving" | "success" | "choosing";

export default function CaptureScreen() {
  const [status, setStatus] = useState<Status>("idle");
  const [lead, setLead] = useState<LeadData>(emptyLead);
  const [imageData, setImageData] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cardCount] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem("rolodex_count") || "0");
    }
    return 0;
  });
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
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setLead({ ...emptyLead, ...data });
      setStatus("review");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(msg);
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
      processImage(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function updateField(field: keyof LeadData, value: string) {
    setLead((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddToRolodex() {
    if (!lead.name && !lead.phone && !lead.email) {
      setErrorMsg("Add at least a name, phone, or email");
      return;
    }
    setErrorMsg("");
    setStatus("choosing");
  }

  async function handleChoice(choice: "sheet" | "phone" | "both") {
    setStatus("saving");
    try {
      if (choice === "sheet" || choice === "both") {
        const res = await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead, image: imageData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save to sheet failed");
        const count = parseInt(localStorage.getItem("rolodex_count") || "0") + 1;
        localStorage.setItem("rolodex_count", String(count));
      }
      if (choice === "phone" || choice === "both") {
        await saveToPhone();
      }
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(msg);
      setStatus("review");
    }
  }

  async function saveToPhone() {
    const res = await fetch("/api/vcard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function reset() {
    setLead(emptyLead);
    setImageData(null);
    setStatus("idle");
    setErrorMsg("");
  }

  // ─── Success ───
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6">
        <div className="text-center animate-scale-in">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-amber-600/20 animate-[pulse-ring_1.5s_ease-out_infinite]" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-1 text-amber-300">Contact Filed!</h2>
          <p className="text-gray-500 mb-8 text-sm">
            {lead.name || "New contact"} added to your Rolodex
          </p>
          <button
            onClick={reset}
            className="btn-press px-10 py-4 bg-amber-600 hover:bg-amber-500 text-gray-950 rounded-2xl font-semibold text-base shadow-lg transition-all"
          >
            Scan Next Card
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ─── Header ─── */}
      <header className="glass sticky top-0 z-50 border-b border-gray-800 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md animate-[gold-glow_3s_ease-in-out_infinite]">
              <svg className="w-5 h-5 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-50">My Digital Rolodex</h1>
              {cardCount > 0 && (
                <p className="text-[10px] text-amber-500 font-medium">{cardCount} contacts saved</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1A76dmwIxNKYXkhg44UK8p-o_7kqND6IlxY4WAdDyxqk/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
              title="Open Google Sheet"
            >
              <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11V9h-6V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-8h-2zm-6 8H9v-2h4v2zm4-4H7v-2h10v2zm0-4H7V9h4v2h6V9z"/>
              </svg>
            </a>
            {status !== "idle" && (
              <button onClick={reset} className="text-xs text-gray-500 hover:text-amber-500 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all font-medium">
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Idle ─── */}
      {status === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
          {/* Rolodex card illustration */}
          <div className="animate-fade-in-up mb-10 relative">
            <div className="absolute -inset-6 bg-amber-600/5 rounded-3xl blur-3xl" />
            <div className="relative animate-[card-float_4s_ease-in-out_infinite]">
              <div className="w-56 h-32 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 gold-border card-shadow p-5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-28 bg-amber-600/20 rounded-full" />
                  <div className="h-2 w-20 bg-white/5 rounded-full" />
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-32 bg-white/5 rounded-full" />
                  <div className="h-1.5 w-24 bg-white/5 rounded-full" />
                </div>
              </div>
              {/* Stacked cards behind */}
              <div className="absolute -z-10 top-2 left-2 right-2 bottom-0 rounded-2xl bg-gray-950 gold-border opacity-40 -rotate-2" />
              <div className="absolute -z-20 top-4 left-3 right-3 bottom-0 rounded-2xl bg-gray-950 border border-white/5 opacity-20 rotate-1" />
            </div>
          </div>

          <h2 className="animate-fade-in-up stagger-1 text-2xl font-bold mb-2 text-center tracking-tight">
            My Digital Rolodex
          </h2>
          <p className="animate-fade-in-up stagger-2 text-gray-500 text-sm text-center mb-10 max-w-[280px] leading-relaxed">
            Snap a business card, AI reads it, and it goes straight to your contacts sheet
          </p>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="animate-fade-in-up stagger-3 btn-press w-full py-4 bg-amber-600 hover:bg-amber-500 text-gray-950 rounded-2xl font-semibold text-base shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Scan Card
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="animate-fade-in-up stagger-4 btn-press w-full py-4 rounded-2xl font-semibold text-sm gold-border hover:bg-amber-900/20 transition-all flex items-center justify-center gap-2.5 text-gray-400 hover:text-amber-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              Upload from Gallery
            </button>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>

          <button
            onClick={() => setStatus("review")}
            className="animate-fade-in stagger-5 mt-6 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            or type manually
          </button>

          <p className="animate-fade-in stagger-6 text-[10px] text-gray-700 mt-auto pt-10">
            Built by Niket · Powered by Claude AI
          </p>
        </div>
      )}

      {/* ─── Processing ─── */}
      {status === "processing" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="animate-scale-in mb-8">
            <div className="relative">
              <div className="absolute -inset-3 rounded-2xl bg-amber-600/10 animate-[pulse-ring_2s_ease-out_infinite]" />
              <div className="relative w-20 h-20 rounded-2xl bg-gray-900 gold-border flex items-center justify-center card-shadow">
                <div className="w-9 h-9 border-[2.5px] border-amber-500 border-t-transparent rounded-full animate-[spin_0.9s_linear_infinite]" />
              </div>
            </div>
          </div>
          <p className="text-amber-300 font-medium animate-fade-in">Reading card...</p>
          <p className="text-gray-600 text-xs mt-1.5 animate-fade-in stagger-1">AI is extracting contact details</p>
          <div className="mt-6 w-44 h-1 rounded-full bg-gray-900 overflow-hidden animate-fade-in stagger-2">
            <div className="h-full bg-amber-600/50 rounded-full shimmer-line" style={{ width: "70%" }} />
          </div>
        </div>
      )}

      {/* ─── Review ─── */}
      {(status === "review" || status === "saving" || status === "choosing") && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5">
            {/* Card image */}
            {imageData && (
              <div className="animate-fade-in-up mb-5 rounded-2xl overflow-hidden gold-border card-shadow">
                <img src={imageData} alt="Card" className="w-full h-auto max-h-40 object-contain bg-gray-950 p-2" />
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="animate-slide-down mb-5 p-4 bg-red-500/8 border border-red-500/15 rounded-2xl flex items-start gap-3">
                <span className="text-red-400 text-sm shrink-0">⚠</span>
                <p className="text-red-300/80 text-sm leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5 animate-fade-in">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-600/15 to-transparent" />
              <span className="text-[10px] text-amber-500/60 font-semibold uppercase tracking-[0.2em]">New Contact</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-600/15 to-transparent" />
            </div>

            {/* Fields */}
            <div className="space-y-2.5">
              {(Object.keys(emptyLead) as (keyof LeadData)[]).map((field, i) => {
                const meta = fieldMeta[field];
                const isTextarea = meta.type === "textarea";
                return (
                  <div key={field} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1 block pl-1">
                      {meta.label}
                    </label>
                    {isTextarea ? (
                      <textarea
                        value={lead[field]}
                        onChange={(e) => updateField(field, e.target.value)}
                        rows={2}
                        placeholder={meta.placeholder}
                        className="input-focus w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none transition-all resize-none"
                      />
                    ) : (
                      <input
                        type={meta.type}
                        value={lead[field]}
                        onChange={(e) => updateField(field, e.target.value)}
                        placeholder={meta.placeholder}
                        className="input-focus w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none transition-all"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add to Rolodex */}
            <button
              onClick={handleAddToRolodex}
              className="btn-press w-full mt-7 mb-8 py-4 bg-amber-600 hover:bg-amber-500 text-gray-950 rounded-2xl font-semibold text-base shadow-lg shadow-amber-600/15 transition-all flex items-center justify-center gap-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add to Rolodex
            </button>
          </div>
        </div>
      )}

      {/* ─── Save Choice Modal ─── */}
      {(status === "choosing" || status === "saving") && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-6" onClick={() => status === "choosing" && setStatus("review")}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden card-shadow">
              <div className="px-6 pt-5 pb-3 text-center">
                <p className="text-sm font-semibold text-gray-300">Save {lead.name || "contact"} to...</p>
              </div>

              <div className="px-4 pb-4 space-y-2">
                <button
                  onClick={() => handleChoice("sheet")}
                  disabled={status === "saving"}
                  className="btn-press w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-3 px-4 disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-600/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 11V9h-6V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-8h-2zm-6 8H9v-2h4v2zm4-4H7v-2h10v2zm0-4H7V9h4v2h6V9z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Google Sheet</p>
                    <p className="text-[11px] text-gray-500">Save to your spreadsheet</p>
                  </div>
                </button>

                <button
                  onClick={() => handleChoice("phone")}
                  disabled={status === "saving"}
                  className="btn-press w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-3 px-4 disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Phone Contacts</p>
                    <p className="text-[11px] text-gray-500">Download as vCard</p>
                  </div>
                </button>

                <button
                  onClick={() => handleChoice("both")}
                  disabled={status === "saving"}
                  className="btn-press w-full py-3.5 rounded-2xl bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/20 transition-all flex items-center gap-3 px-4 disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-600/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-amber-300">Save to Both</p>
                    <p className="text-[11px] text-gray-500">Sheet + Phone Contacts</p>
                  </div>
                </button>
              </div>

              {status === "saving" && (
                <div className="px-6 pb-4 flex items-center justify-center gap-2 text-amber-300 text-sm">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]" />
                  Saving...
                </div>
              )}
            </div>

            <button
              onClick={() => setStatus("review")}
              className="w-full mt-2 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
