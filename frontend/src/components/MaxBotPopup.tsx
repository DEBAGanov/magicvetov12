/**
 * @file: components/ui/MaxBotPopup.tsx
 * @description: Popup to encourage MAX bot subscription — triggers on leave intent or inactivity
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const MAX_BOT_URL = "https://max.ru/id121602873440_bot";
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
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(90deg, #0068f2, #6201c8)" }}
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5" fill="white"><path d="M8.80273 1.08491C9.45417 0.991827 11.0494 0.951991 11.6748 1.08491C13.4713 1.45734 14.9721 2.2559 16.2686 3.51265C17.69 4.8892 18.395 6.21947 18.8096 8.16792C19.0069 9.12553 19.0812 10.5201 18.8838 11.4775C18.5021 13.2794 17.8312 14.8915 16.6074 16.1416C15.91 16.8463 15.3409 17.3266 14.5908 17.7587C13.0156 18.5698 11.9323 18.9516 10.3877 18.996L10.0732 19C8.61564 19 7.88228 18.7012 6.6582 17.9697L6.19043 17.6455L5.48047 18.3027C4.91445 18.8277 3.94949 18.9999 3.57617 19C2.94159 18.9999 2.62671 18.919 2.34375 18.4736C2.26908 16.8187 2.19808 16.7867 1.93359 15.6142L1.68945 14.5419C1.39464 13.2317 1.00243 11.3677 1 10.3867C1.00001 8.31889 1.11213 8.65611 1.48535 7.0771C2.64359 3.69234 5.49258 1.54395 8.80273 1.08491ZM10.8281 5.56831C10.5192 5.50314 9.71933 5.47681 9.39746 5.52241C7.76256 5.74753 6.43347 6.87956 5.86133 8.53902C5.60129 9.2889 5.50002 9.96749 5.5 10.9814C5.50308 12.2589 5.73232 13.545 6.06348 14.1738L6.13086 14.291C6.27059 14.5093 6.36799 14.5456 6.58887 14.4511C6.77413 14.3696 7.14818 14.1022 7.42773 13.8447L7.60645 13.6845L7.89941 13.8574C8.50387 14.2159 9.15088 14.4116 9.82031 14.4443C10.6815 14.4833 11.4817 14.2847 12.2617 13.8349C12.6322 13.623 12.8928 13.4139 13.2373 13.0683C13.8418 12.4554 14.2382 11.7086 14.4268 10.8251C14.5242 10.3557 14.5242 9.6189 14.4268 9.14937L14.3398 8.79976C14.1122 8.00523 13.7119 7.34925 13.0977 6.75874C12.4573 6.14255 11.7155 5.75092 10.8281 5.56831Z" /></svg>
            Написать в Max
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
