"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CLIENT_CONFIG = {
  clientId: "zaika_punjabi_rasoi_01",
  businessName: "Zaika Punjabi Rasoi",
  subHeading: "Punjabi Restaurant in Yamuna Vihar, Delhi",
  tagline: "AUTHENTIC PUNJABI FOOD • HYGIENIC DINING • FAMILY RESTAURANT",
  description:
    "Popular Punjabi restaurant in Yamuna Vihar, Delhi, rated 4.7 on Google by 500+ diners. Serving delicious North Indian dishes, fresh breads, starters, and mouth-watering meals.",
  city: "Yamuna Vihar, Delhi 110053",
  fullAddress: "Ground Floor, C-2/341, near Punjabi Rasoi, Block C, Yamuna Vihar, Delhi, 110053",
  phone: "+919311060505",
  cleanPhone: "919311060505",
  logoUrl: "/logo.png",
  googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJQ7FvGR39DDkR_cX-F2Y0OfA",
  mapsDirectionUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Zaika Punjabi Rasoi, C-2/341, Block C, Yamuna Vihar, Delhi 110053"),
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  whatsappChannelUrl: "",
  agencyName: "VR Max AI",
  agencyWhatsapp: "918700660097",
  agencyPhoneDisplay: "+91 87006 60097",
  customInstruction:
    "You are an authentic local customer writing an unscripted Google Maps review for Zaika Punjabi Rasoi in Yamuna Vihar, Delhi. Write like a real human speaking straight from the heart. Mention random specific dishes organically. Strictly DO NOT use full stops (.) at the end of sentences. Vary lengths completely randomly (some 1-line quick reviews, some 2-line, some 3-4 lines detailed). Never use robotic or repetitive openings.",
  chips: [
    { label: "All", context: "overall restaurant experience" },
    { label: "Best Taste", context: "amazing and authentic food taste" },
    { label: "Pocket Friendly", context: "pocket friendly and budget pricing" },
    { label: "Family Friendly", context: "great family restaurant with a comfortable vibe" },
    { label: "Fresh & Hot", context: "food served fresh and piping hot" },
    { label: "Clean Ambience", context: "clean, hygienic, and well maintained place" },
    { label: "Fast Service", context: "quick service and attentive staff" },
    { label: "Yamuna Vihar", context: "easy to reach location in Yamuna Vihar" },
    { label: "Good Quantity", context: "satisfying portion size and quantity" }
  ],
};

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  `${CLIENT_CONFIG.businessName}, ${CLIENT_CONFIG.fullAddress}`
)}&output=embed`;

const AGENCY_WA_LINK = `https://wa.me/${CLIENT_CONFIG.agencyWhatsapp}?text=${encodeURIComponent(
  "Hi VR Max AI, I want to get a QR review system for my business."
)}`;

function useTypewriter(fullText, totalMs = 2300) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }

    setDisplayText("");
    setIsTyping(true);

    const COMMA_PAUSE = 90;
    const commas = (fullText.match(/,/g) || []).length;
    const base = Math.min(
      26,
      Math.max(10, (totalMs - commas * COMMA_PAUSE) / fullText.length)
    );

    const times = [];
    let t = 0;

    for (let i = 0; i < fullText.length; i++) {
      t += base;
      times.push(t);
      if (fullText[i] === ",") t += COMMA_PAUSE;
    }

    const start = performance.now();
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      let n = 0;

      while (n < times.length && times[n] <= elapsed) n++;

      setDisplayText(fullText.slice(0, n));

      if (n >= fullText.length) {
        setIsTyping(false);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fullText, totalMs]);

  return { displayText, isTyping };
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Fallback below
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

export default function UniversalReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState(["All"]);
  const firstRunRef = useRef(true);
  const [language, setLanguage] = useState("ENGLISH");
  const [reviewDraft, setReviewDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const recentLengthsRef = useRef([]);
  const { displayText, isTyping } = useTypewriter(reviewDraft);

  useEffect(() => {
    setMounted(true);

    return () => {
      requestIdRef.current++;
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateAIReview = useCallback(async (labels, lang) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCopied(false);
    setError("");
    setReviewDraft("");

    try {
      const effectiveFocus = labels.join(" + ");

      const res = await fetch("/api/reviews", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          businessName: CLIENT_CONFIG.businessName,
          category: CLIENT_CONFIG.tagline,
          description: CLIENT_CONFIG.description,
          city: CLIENT_CONFIG.city,
          selectedService: effectiveFocus,
          selectedChips: labels,
          customInstruction: CLIENT_CONFIG.customInstruction,
          language: lang,
          nonce: Math.random().toString(36).substring(2, 12),
          timestamp: Date.now(),
          randomSeed: Math.floor(Math.random() * 100000),
          recentLengths: recentLengthsRef.current,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Draft generation failed (${res.status}).`);
      }

      if (!data.review?.trim()) {
        throw new Error("The API returned an empty draft.");
      }

      if (requestId !== requestIdRef.current) return;

      if (data.meta) {
        recentLengthsRef.current = [
          ...recentLengthsRef.current,
          data.meta,
        ].slice(-6);
      }

      setReviewDraft(data.review.trim());
    } catch (err) {
      if (err.name === "AbortError") return;

      if (requestId === requestIdRef.current) {
        setError(err.message || "Unable to generate a draft.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const delay = firstRunRef.current ? 0 : 350;
    firstRunRef.current = false;

    const t = setTimeout(
      () => generateAIReview(selectedLabels, language),
      delay
    );

    return () => {
      clearTimeout(t);
      abortControllerRef.current?.abort();
    };
  }, [mounted, selectedLabels, language, generateAIReview]);

  function handleChipChange(chipObj) {
    if (chipObj.label === "All") {
      if (
        selectedLabels.length === 1 &&
        selectedLabels[0] === "All"
      ) {
        generateAIReview(["All"], language);
      } else {
        setSelectedLabels(["All"]);
      }
      return;
    }

    let next = selectedLabels.filter((l) => l !== "All");

    if (next.includes(chipObj.label)) {
      next = next.filter((l) => l !== chipObj.label);
    } else {
      next = [...next, chipObj.label];
      if (next.length > 3) next = next.slice(-3);
    }

    setSelectedLabels(next.length ? next : ["All"]);
  }

  function handleLanguageChange(lang) {
    if (lang === language) {
      generateAIReview(selectedLabels, lang);
      return;
    }

    setLanguage(lang);
  }

  async function handleCopyAndRedirect() {
    if (!reviewDraft || loading || isTyping) return;

    const ok = await copyToClipboard(reviewDraft);

    if (!ok) {
      setError("Could not copy the draft. Please select and copy it manually.");
      return;
    }

    setCopied(true);

    setTimeout(() => {
      window.location.href = CLIENT_CONFIG.googleReviewUrl;
    }, 550);
  }

  function handleSaveContact() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${CLIENT_CONFIG.businessName}
ORG:${CLIENT_CONFIG.businessName}
TEL;TYPE=CELL:${CLIENT_CONFIG.phone}
ADR;TYPE=WORK:;;${CLIENT_CONFIG.fullAddress};;;;
NOTE:${CLIENT_CONFIG.subHeading}
END:VCARD`;

    const blob = new Blob([vcard], {
      type: "text/vcard;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${CLIENT_CONFIG.businessName.replace(/\s+/g, "_")}.vcf`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#b91c1c",
        }}
      />
    );
  }

  return (
    <main className="soft-luxury-viewport">
      <div className="main-content-flow">
        {/* Logo */}
        <div className="brand-medallion-badge">
          <div
            className="logo-circle-container"
            style={{
              backgroundImage: `url(${CLIENT_CONFIG.logoUrl})`,
            }}
            role="img"
            aria-label={`${CLIENT_CONFIG.businessName} logo`}
          ></div>

          <h1 className="brand-main-title">
            {CLIENT_CONFIG.businessName}
          </h1>
        </div>

        <p className="brand-serif-subtitle">
          {CLIENT_CONFIG.subHeading}
        </p>

        <div className="royal-shahi-divider">
          <span className="divider-line"></span>
          <span className="divider-gem">◆</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster" aria-hidden="true">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
        </div>

        <p className="experience-tracker-title">
          SHARE YOUR EXPERIENCE
        </p>

        {/* Filter Chips */}
        <div className="floating-pills-cloud">
          {CLIENT_CONFIG.chips.map((chip) => {
            const active = selectedLabels.includes(chip.label);

            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipChange(chip)}
                className={`embossed-pill ${active ? "active" : ""}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <p className="chip-hint">
          Tap up to 3 keywords for your review
        </p>

        {/* Language Selector */}
        <div className="capsule-lang-dock">
          {["ENGLISH", "HINGLISH"].map((lang) => {
            const active = language === lang;

            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`capsule-lang-btn ${active ? "active" : ""}`}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Review Box */}
        <div className="signature-review-box">
          <div className="box-top-ribbon">
            <div className="label-badge">
              <span className="dot-ping"></span>
              YOUR REVIEW
            </div>

            <button
              type="button"
              disabled={loading || isTyping}
              onClick={() => generateAIReview(selectedLabels, language)}
              className="top-rewrite-btn"
            >
              <span>Rewrite</span>
            </button>
          </div>

          <div className="review-display-zone">
            {loading ? (
              <div className="loader-shimmer-wrap">
                <span className="sparkle-icon">✦</span>
                <span className="shimmer-text">
                  Crafting authentic review...
                </span>
              </div>
            ) : error ? (
              <p className="review-error">{error}</p>
            ) : reviewDraft ? (
              <p className="review-body-text">
                {displayText}
                {isTyping && (
                  <span className="typewriter-cursor"></span>
                )}
              </p>
            ) : (
              <p className="review-placeholder">
                Your review draft will appear here.
              </p>
            )}
          </div>

          <div className="card-ornament-center">
            <span>◆</span>
          </div>

          <button
            type="button"
            disabled={loading || isTyping || !reviewDraft}
            onClick={handleCopyAndRedirect}
            className={`full-luxury-copy-btn ${copied ? "copied" : ""}`}
          >
            <span>
              {copied
                ? "Copied! Opening Google..."
                : "Copy & Paste on Google"}
            </span>
          </button>

          <p className="card-disclaimer-note">
            Please review the wording before posting.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <div className="soft-action-grid">
            <div className="action-row-upper">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${CLIENT_CONFIG.cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc whatsapp-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <span className="icon-tag">WhatsApp</span>
              </a>

              {/* Call Us */}
              <a href={`tel:${CLIENT_CONFIG.phone}`} className="soft-circle-action">
                <div className="icon-disc call-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="icon-tag">Call Us</span>
              </a>

              {/* Save Contact */}
              <button
                type="button"
                onClick={handleSaveContact}
                className="soft-circle-action"
              >
                <div className="icon-disc contact-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <span className="icon-tag">Save Contact</span>
              </button>

              {/* Directions */}
              <a
                href={CLIENT_CONFIG.mapsDirectionUrl}
                target="_blank"
                rel="noreferrer"
                className="soft-circle-action"
              >
                <div className="icon-disc map-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span className="icon-tag">Directions</span>
              </a>
            </div>

            <div className="action-row-lower" style={(!CLIENT_CONFIG.instagramUrl && !CLIENT_CONFIG.facebookUrl && !CLIENT_CONFIG.youtubeUrl && !CLIENT_CONFIG.whatsappChannelUrl) ? { display: "none" } : undefined}>
              {/* Instagram */}
              {CLIENT_CONFIG.instagramUrl && (
                <a
                  href={CLIENT_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="soft-circle-action"
                >
                  <div className="icon-disc insta-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <span className="icon-tag">Instagram</span>
                </a>
              )}

              {/* WhatsApp Channel */}
              {CLIENT_CONFIG.whatsappChannelUrl && (
                <a
                  href={CLIENT_CONFIG.whatsappChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="soft-circle-action"
                >
                  <div className="icon-disc wa-channel-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <span className="icon-tag">WA Channel</span>
                </a>
              )}

              {/* Facebook */}
              {CLIENT_CONFIG.facebookUrl && (
                <a
                  href={CLIENT_CONFIG.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="soft-circle-action"
                >
                  <div className="icon-disc fb-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </div>
                  <span className="icon-tag">Facebook</span>
                </a>
              )}

              {/* YouTube */}
              {CLIENT_CONFIG.youtubeUrl && (
                <a
                  href={CLIENT_CONFIG.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="soft-circle-action"
                >
                  <div className="icon-disc yt-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="icon-tag">YouTube</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Map Card */}
        <div className="embedded-map-card">
          <a
            href={CLIENT_CONFIG.mapsDirectionUrl}
            target="_blank"
            rel="noreferrer"
            className="map-card-header-link"
          >
            <div className="address-highlight-box">
              <p className="agency-clean-address">
                <strong>📍 Address:</strong> {CLIENT_CONFIG.fullAddress}
              </p>
            </div>

            <div className="map-card-header">
              <span>Visit Store • Yamuna Vihar, Delhi</span>
            </div>
          </a>

          <div className="map-iframe-container">
            <iframe
              title="Zaika Punjabi Rasoi Location"
              src={MAP_EMBED_URL}
              width="100%"
              height="170"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <a
            href={CLIENT_CONFIG.mapsDirectionUrl}
            target="_blank"
            rel="noreferrer"
            className="map-directions-link"
          >
            Get Directions on Google Maps &rarr;
          </a>
        </div>

        {/* Mini Footer */}
        <footer className="mini-footer">
          <span className="mini-footer-pill">
            Powered by <strong>{CLIENT_CONFIG.agencyName}</strong>
            <span className="mini-footer-dot">•</span>
            Get QR:
            <a href={AGENCY_WA_LINK} target="_blank" rel="noreferrer">
              {CLIENT_CONFIG.agencyPhoneDisplay}
            </a>
          </span>
        </footer>
      </div>

      <style jsx global>{`
        /* =========================================
           SOFT LUXURY COLOR SYSTEM
           Pure Red Theme with Dark Cards
           ========================================= */

        .soft-luxury-viewport {
          min-height: 100vh;
          background: #b91c1c; /* Pure Red Background */
          padding: 10px 16px 24px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .main-content-flow {
          width: 100%;
          max-width: 410px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .brand-medallion-badge {
          margin-top: 2px;
          margin-bottom: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-circle-container {
          width: 98px;
          height: 98px;
          border-radius: 50%;
          background-color: transparent;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow:
            0 10px 25px rgba(0, 0, 0, 0.3),
            0 3px 9px rgba(0, 0, 0, 0.2);
          margin-bottom: 8px;
          animation: floatLogo 3.5s ease-in-out infinite;
          border: 3px solid #ffffff;
          transition: transform 0.2s ease;
        }

        .logo-circle-container:active {
          transform: scale(0.96);
        }

        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .logo-circle-container { animation: none; }
        }

        .brand-main-title {
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px;
          letter-spacing: 0.3px;
        }

        .brand-serif-subtitle {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 12.5px;
          color: #fecaca;
          margin: 0 0 4px;
        }

        .royal-shahi-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85%;
          margin: 4px auto 8px;
          gap: 10px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
        }

        .divider-gem {
          color: #ffffff;
          font-size: 8px;
        }

        .stars-cluster {
          display: flex;
          gap: 4px;
          color: #fde047;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .chip-hint {
          text-align: center;
          font-size: 11px;
          color: #fecaca;
          margin: 0 0 8px;
          letter-spacing: 0.3px;
        }

        .experience-tracker-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #ffffff;
          text-transform: uppercase;
          margin: 0 0 8px;
        }

        .floating-pills-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
          margin: 0 auto 8px;
          width: 100%;
        }

        /* Dark maroon chips */
        .embossed-pill {
          border-radius: 999px;
          padding: 5px 11px;
          font-size: 11.5px;
          background: #7f1d1d;
          color: #fecaca;
          border: 1px solid #991b1b;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition:
            background 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.16s ease;
        }

        .embossed-pill:active {
          transform: scale(0.97);
        }

        /* White selected chip */
        .embossed-pill.active {
          background: #ffffff;
          color: #b91c1c;
          border-color: #ffffff;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .capsule-lang-dock {
          display: inline-flex;
          background: #7f1d1d;
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          margin: 0 auto 12px;
          box-shadow: 0 2px 7px rgba(0, 0, 0, 0.2);
          border: 1px solid #991b1b;
        }

        .capsule-lang-btn {
          padding: 5px 18px;
          border-radius: 999px;
          border: none;
          background: transparent;
          font-size: 10px;
          font-weight: 700;
          color: #fecaca;
          cursor: pointer;
        }

        /* White selected language */
        .capsule-lang-btn.active {
          background: #ffffff;
          color: #b91c1c;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .signature-review-box {
          width: 100%;
          background: #7f1d1d;
          border-radius: 24px;
          padding: 18px;
          box-sizing: border-box;
          box-shadow: 0 9px 24px rgba(0, 0, 0, 0.25);
          margin-bottom: 16px;
          text-align: left;
          border-top: 4px solid #ffffff;
          color: #ffffff;
        }

        .box-top-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .label-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          color: #fecaca;
          text-transform: uppercase;
        }

        .dot-ping {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffffff;
        }

        .top-rewrite-btn {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: #991b1b;
          border: 1px solid #b91c1c;
          color: #ffffff;
          font-size: 10.5px;
          font-weight: 650;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .top-rewrite-btn:active {
          transform: scale(0.95);
        }

        .review-display-zone {
          min-height: 132px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 2px 8px;
        }

        .loader-shimmer-wrap {
          color: #fca5a5;
          font-size: 12px;
          font-style: italic;
        }

        .review-body-text {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.6;
          color: #ffffff;
          margin: 0;
          width: 100%;
          white-space: pre-wrap;
        }

        .review-placeholder {
          font-family: Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: #fca5a5;
          margin: 0;
        }

        .review-error {
          font-size: 12px;
          color: #fca5a5;
          margin: 0;
        }

        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: #ffffff;
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 0.7s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .card-ornament-center {
          text-align: center;
          color: #ffffff;
          font-size: 7px;
          margin: 6px 0 10px;
        }

        .full-luxury-copy-btn {
          width: 100%;
          height: 50px;
          border-radius: 999px;
          background: #ffffff;
          border: none;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.3);
          transition: transform 0.15s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .full-luxury-copy-btn.copied {
          background: #fecaca;
        }

        .full-luxury-copy-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .full-luxury-copy-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .card-disclaimer-note {
          font-size: 9.5px;
          color: #fecaca;
          text-align: center;
          margin: 8px 0 0;
          font-style: italic;
        }

        .quick-actions-card {
          width: 100%;
          background: #7f1d1d;
          border-radius: 22px;
          padding: 18px 12px;
          box-sizing: border-box;
          border: 1px solid #991b1b;
          box-shadow: 0 7px 20px rgba(0, 0, 0, 0.2);
          margin-bottom: 16px;
        }

        .soft-action-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .action-row-upper {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }

        .action-row-lower {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }

        .soft-circle-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          text-decoration: none !important;
          color: #ffffff;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s ease;
        }

        .soft-circle-action:active {
          transform: scale(0.92);
        }

        .icon-disc {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #991b1b;
          display: grid;
          place-items: center;
          box-shadow: 0 3px 9px rgba(0, 0, 0, 0.2);
          border: 1px solid #b91c1c;
          transition: all 0.2s ease;
        }

        .icon-disc svg {
          width: 20px;
          height: 20px;
          stroke: #ffffff;
          transition: stroke 0.2s ease;
        }

        .whatsapp-disc:hover { background: #25d366; border-color: #25d366; }
        .call-disc:hover { background: #007aff; border-color: #007aff; }
        .contact-disc:hover { background: #ffffff; border-color: #ffffff; }
        .contact-disc:hover svg { stroke: #b91c1c; }
        .map-disc:hover { background: #ea4335; border-color: #ea4335; }
        .insta-disc:hover {
          background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
          border-color: transparent;
        }
        .wa-channel-disc:hover { background: #25d366; border-color: #25d366; }
        .fb-disc:hover { background: #1877f2; border-color: #1877f2; }
        .yt-disc:hover { background: #ff0000; border-color: #ff0000; }

        .icon-tag {
          font-size: 9.5px;
          font-weight: 700;
          color: #ffffff;
        }

        .embedded-map-card {
          width: 100%;
          background: #7f1d1d;
          border-radius: 22px;
          padding: 14px 16px;
          box-sizing: border-box;
          border: 1px solid #991b1b;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
          margin-bottom: 12px;
          text-align: left;
        }

        .map-card-header-link {
          text-decoration: none;
        }

        .map-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .map-iframe-container {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #991b1b;
          margin-bottom: 8px;
        }

        .map-directions-link {
          font-size: 11px;
          font-weight: 750;
          color: #fca5a5;
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 8px;
        }

        .address-highlight-box {
          background: #991b1b;
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid #b91c1c;
          margin-bottom: 8px;
        }

        .agency-clean-address {
          font-size: 10.5px;
          color: #fecaca;
          margin: 0;
          line-height: 1.4;
          text-align: center;
        }

        /* Mini Footer */
        .mini-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 2px;
        }

        .mini-footer-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
          padding: 5px 12px;
          border: 1px solid #991b1b;
          border-radius: 999px;
          background: #7f1d1d;
          font-size: 8.5px;
          letter-spacing: 0.3px;
          color: #fecaca;
          line-height: 1.4;
        }

        .mini-footer-pill strong {
          color: #ffffff;
          font-weight: 700;
        }

        .mini-footer-dot {
          color: #ffffff;
        }

        .mini-footer-pill a {
          color: #ffffff;
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
