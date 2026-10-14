"use client";

import { useEffect, useState } from "react";

export default function Greeting() {
  const [text, setText] = useState("Welcome, Doctor");
  useEffect(() => {
    const h = new Date().getHours();
    const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const name = localStorage.getItem("perioai_clinician");
    setText(`${part}, ${name ? name : "Doctor"}`);
  }, []);
  return <>{text}</>;
}
