"use client";

import { useState, useEffect } from "react";
import LoginScreen from "@/components/LoginScreen";
import CaptureScreen from "@/components/CaptureScreen";

export default function Home() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("cc_auth") === "1") setAuthed(true);
  }, []);

  function handleLogin() {
    sessionStorage.setItem("cc_auth", "1");
    setAuthed(true);
  }

  if (!authed) return <LoginScreen onLogin={handleLogin} />;
  return <CaptureScreen />;
}
