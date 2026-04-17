/**
 * @file: components/ui/MaxBotPopup.tsx
 * @description: Popup to encourage MAX bot subscription — triggers on leave intent or inactivity
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const MAX_BOT_URL = "https://m.max.ru/chat/id121602873440_bot";
const INACTIVITY_MS = 45_000; // 45 seconds of inactivity
const SESSION_KEY = "mc_popup_shown";

export default function MaxBotPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  // Show on leave intent (mouse leaves viewport top)
  useEffect(() => {
    const handleMouseOut = (e: MouseEvent) => {
      if (dismissed) return;
      if (e.clientY < 5) {
        show();
      }
    };
    document.addEventListener("mouseout", handleMouseOut);
    return () => document.removeEventListener("mouseout", handleMouseOut);
  }, [dismissed, show]);

  // Show on inactivity (no scroll/click/keypress for 45s)
  useEffect(() => {
    if (dismissed) return;

    const resetInactivity = () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(show, INACTIVITY_MS);
    };

    resetInactivity();

    const events = ["scroll", "click", "keydown", "touchstart"] as const;
    events.forEach((evt) => window.addEventListener(evt, resetInactivity, { passive: true }));
    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetInactivity));
    };
  }, [dismissed, show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={dismiss} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Закрыть"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        </button>

        <div className="text-center">
          <div className="text-5xl mb-3">💬</div>
          <h3 className="text-xl font-bold mb-2">Не нашли подходящий букет?</h3>
          <p className="text-gray-500 text-sm mb-5">
            Подпишитесь на нашего бота в МАХ — поможем подобрать идеальный букет, покажем новые поступления и предложим скидки!
          </p>

          <a
            href={MAX_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
          >
            Открыть бота в МАХ
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" /></svg>
          </a>

          <button
            onClick={dismiss}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Продолжить выбор на сайте
          </button>
        </div>
      </div>
    </div>
  );
}
