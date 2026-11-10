'use client';

import { useState, useEffect, useRef, useCallback } from "react";

// =====================================================================
//  CLIENT CONFIGURATION (Zaika Punjabi Rasoi - Yamuna Vihar)
// =====================================================================
const CLIENT_CONFIG = {
  businessName: "Zaika Punjabi Rasoi",
  subHeading: "Punjabi Restaurant in Yamuna Vihar, Delhi",
  tagline: "AUTHENTIC PUNJABI FOOD • HYGIENIC DINING • FAMILY RESTAURANT",
  description:
    "Popular Punjabi restaurant in Yamuna Vihar, Delhi, rated 4.7 on Google by 500+ diners. Serving delicious North Indian dishes, fresh breads, starters, and mouth-watering meals.",
  city: "Yamuna Vihar, Delhi 110053",
  areaLabel: "Yamuna Vihar, Delhi",
  fullAddress: "Ground Floor, C-2/341, near Punjabi Rasoi, Block C, Yamuna Vihar, Delhi, 110053",
  phone: "+919311060505",
  cleanPhone: "919311060505",
  logoUrl: "/logo.png",

  googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJQ7FvGR39DDkR_cX-F2Y0OfA",
  mapsDirectionUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Zaika Punjabi Rasoi, C-2/341, Block C, Yamuna Vihar, Delhi 110053"),

  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",

  agencyName: "VR Max AI",
  agencyWhatsapp: "918700660097",
  agencyPhoneDisplay: "+91 87006 60097",

  // Root file ke chips ke sath exact matching list
  chips: [
    'Best Taste',
    'Pocket Friendly',
    'Family Friendly',
    'Fresh & Hot',
    'Clean Ambience',
    'Fast Service',
    'Yamuna Vihar',
    'Good Quantity',
  ],
};

const HAS_SOCIAL = !!(CLIENT_CONFIG.instagramUrl || CLIENT_CONFIG.facebookUrl || CLIENT_CONFIG.youtubeUrl);

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  `${CLIENT_CONFIG.businessName}, ${CLIENT_CONFIG.fullAddress}`
)}&output=embed`;

const AGENCY_WA_LINK = `https://wa.me/${CLIENT_CONFIG.agencyWhatsapp}?text=${encodeURIComponent(
  "Hi VR Max AI, I want to get a QR review system for my business."
)}`;

function useTypewriter(fullText, speed = 10) {
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
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [fullText, speed]);

  return { displayText, isTyping };
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

export default function RestaurantReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedChips, setSelectedChips] = useState([]);
  const [language, setLanguage] = useState("HINGLISH");
  const [reviewDraft, setReviewDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const recentLengthsRef = useRef([]);
  const { displayText, isTyping } = useTypewriter(reviewDraft, 10);

  useEffect(() => {
    setMounted(true);
    return () => {
      requestIdRef.current++;
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateAIReview = useCallback(async (chipsToUse, lang) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCopied(false);
    setError("");
    setReviewDraft("");

    try {
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
          selectedChips: chipsToUse,
          language: lang,
          nonce: Math.random().toString(36).substring(2, 12),
          timestamp: Date.now(),
          recentLengths: recentLengthsRef.current,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Draft generation failed (${res.status}).`);
      if (!data.review?.trim()) throw new Error("The API returned an empty draft.");
      if (requestId !== requestIdRef.current) return;

      if (data.meta) {
        recentLengthsRef.current = [...recentLengthsRef.current, data.meta].slice(-6);
      }
      setReviewDraft(data.review.trim());
    } catch (err) {
      if (err.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setError(err.message || "Unable to generate a draft.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    generateAIReview(selectedChips, language);
    return () => abortControllerRef.current?.abort();
  }, [mounted, selectedChips, language, generateAIReview]);

  function toggleChip(chip) {
    let updated;
    if (selectedChips.includes(chip)) {
      updated = selectedChips.filter((c) => c !== chip);
    } else {
      if (selectedChips.length >= 3) {
        alert("Aap max 3 chips select kar sakte hain.");
        return;
      }
      updated = [...selectedChips, chip];
    }
    setSelectedChips(updated);
  }

  function handleLanguageChange(lang) {
    if (lang === language) {
      generateAIReview(selectedChips, lang);
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

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${CLIENT_CONFIG.businessName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#991b1b" }} />;

  return (
    <main className="soft-luxury-viewport">
      <div className="main-content-flow">
        {/* Logo */}
        <div className="brand-medallion-badge">
          <div
            className="logo-circle-container"
            style={{ backgroundImage: `url(${CLIENT_CONFIG.logoUrl})` }}
            role="img"
            aria-label={`${CLIENT_CONFIG.businessName} logo`}
          ></div>
          <h1 className="brand-main-title">{CLIENT_CONFIG.businessName}</h1>
        </div>

        <p className="brand-serif-subtitle">{CLIENT_CONFIG.subHeading}</p>

        <div className="royal-shahi-divider">
          <span className="divider-line"></span>
          <span className="divider-gem">◆</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster" aria-hidden="true">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>

        <p className="experience-tracker-title">SHARE YOUR EXPERIENCE</p>

        {/* Filter Chips */}
        <div className="floating-pills-cloud">
          {CLIENT_CONFIG.chips.map((chip) => {
            const active = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={`embossed-pill ${active ? "active" : ""}`}
              >
                {chip} {active && "✓"}
              </button>
            );
          })}
        </div>

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
              onClick={() => generateAIReview(selectedChips, language)}
              className="top-rewrite-btn"
            >
              <span>Rewrite</span>
            </button>
          </div>

          <div className="review-display-zone">
            {loading ? (
              <div className="loader-shimmer-wrap">
                <span className="sparkle-icon">✦</span>
                <span className="shimmer-text"> Crafting authentic review...</span>
              </div>
            ) : error ? (
              <p className="review-error">{error}</p>
            ) : reviewDraft ? (
              <p className="review-body-text">
                {displayText}
                {isTyping && <span className="typewriter-cursor"></span>}
              </p>
            ) : (
              <p className="review-placeholder">Your review draft will appear here.</p>
            )}
          </div>

          <div className="card-ornament-center"><span>◆</span></div>

          <button
            type="button"
            disabled={loading || isTyping || !reviewDraft}
            onClick={handleCopyAndRedirect}
            className="full-luxury-copy-btn"
          >
            <span>{copied ? "Copied! Opening Google..." : "Copy & Paste on Google"}</span>
          </button>
          <p className="card-disclaimer-note">Please review the wording before posting.</p>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <div className="soft-action-grid">
            <div className="action-row-upper">
              {/* WhatsApp */}
              <a href={`https://wa.me/${CLIENT_CONFIG.cleanPhone}`} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc whatsapp-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <span className="icon-tag">WhatsApp</span>
              </a>

              {/* Call Us */}
              <a href={`tel:${CLIENT_CONFIG.phone}`} className="soft-circle-action">
                <div className="icon-disc call-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <span className="icon-tag">Call Us</span>
              </a>

              {/* Save Contact */}
              <button type="button" onClick={handleSaveContact} className="soft-circle-action">
                <div className="icon-disc contact-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <span className="icon-tag">Save Contact</span>
              </button>

              {/* Directions */}
              <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc map-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <span className="icon-tag">Directions</span>
              </a>
            </div>

            <div className="action-row-lower" style={HAS_SOCIAL ? undefined : { display: "none" }}>
              {CLIENT_CONFIG.instagramUrl && (
                <a href={CLIENT_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                  <div className="icon-disc insta-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </div>
                  <span className="icon-tag">Instagram</span>
                </a>
              )}
              {CLIENT_CONFIG.facebookUrl && (
                <a href={CLIENT_CONFIG.facebookUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                  <div className="icon-disc fb-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </div>
                  <span className="icon-tag">Facebook</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Map Card */}
        <div className="embedded-map-card">
          <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="map-card-header-link">
            <div className="address-highlight-box">
              <p className="agency-clean-address"><strong>📍 Address:</strong> {CLIENT_CONFIG.fullAddress}</p>
            </div>
            <div className="map-card-header">
              <span>Visit Us • {CLIENT_CONFIG.areaLabel}</span>
            </div>
          </a>
          <div className="map-iframe-container">
            <iframe
              title={`${CLIENT_CONFIG.businessName} Location`}
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
        /* ===== THEME: Vibrant Pure Red Background + Dark Luxury Cards ===== */
        .soft-luxury-viewport {
          --bg: #991b1b;
          --card: #1c0909;
          --soft: #2c0f0f;
          --ln: #4c1d1d;
          --bt-a: #ef4444;
          --bt-b: #dc2626;
          --bx: #ffffff;
          --ac: #fca5a5;
          --tx: #fef2f2;
          --tx2: #fecaca;
          --mu: #f38181;
          --ic: #fca5a5;
          --sh: rgba(0, 0, 0, 0.4);
          --err: #fca5a5;
          --pat-ring: rgba(255, 255, 255, 0.08);
          --pat-dot: rgba(255, 255, 255, 0.15);
        }

        .soft-luxury-viewport {
          min-height: 100vh;
          background-color: var(--bg);
          background-image:
            radial-gradient(circle at 16px 16px, var(--pat-dot) 1.5px, transparent 2px),
            radial-gradient(circle at 16px 16px, transparent 5px, var(--pat-ring) 5.5px, var(--pat-ring) 6.4px, transparent 6.9px);
          background-size: 32px 32px;
          padding: 14px 16px 24px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--tx);
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
          margin-top: 12px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo-circle-container {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background-color: var(--soft);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 0 14px 34px var(--sh), 0 6px 14px rgba(0, 0, 0, 0.3);
          margin-bottom: 12px;
          animation: floatLogo 3.5s ease-in-out infinite;
          border: 3px solid #ffffff;
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .brand-main-title {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 800;
          color: var(--tx);
          margin: 0 0 4px;
          letter-spacing: 0.3px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .brand-serif-subtitle {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 13.5px;
          color: var(--tx2);
          margin: 0 0 10px;
        }
        .royal-shahi-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85%;
          margin: 8px auto 12px;
          gap: 10px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        }
        .divider-gem {
          color: #ffffff;
          font-size: 8px;
        }
        .stars-cluster {
          display: flex;
          gap: 4px;
          color: #fde047;
          font-size: 16px;
          margin-bottom: 4px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .experience-tracker-title {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #fecaca;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .floating-pills-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-bottom: 14px;
          width: 100%;
        }
        .embossed-pill {
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 11px;
          background: var(--card);
          color: var(--tx);
          border: 1px solid var(--ln);
          cursor: pointer;
          box-shadow: 0 2px 8px var(--sh);
          transition: all 0.16s ease;
        }
        .embossed-pill:active {
          transform: scale(0.95);
        }
        .embossed-pill.active {
          background: #ffffff;
          color: #991b1b;
          font-weight: 800;
          border-color: #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        }
        .capsule-lang-dock {
          display: inline-flex;
          background: var(--card);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          margin-bottom: 16px;
          box-shadow: 0 3px 10px var(--sh);
          border: 1px solid var(--ln);
        }
        .capsule-lang-btn {
          padding: 5px 18px;
          border-radius: 999px;
          border: none;
          background: transparent;
          font-size: 10px;
          font-weight: 700;
          color: var(--mu);
          cursor: pointer;
        }
        .capsule-lang-btn.active {
          background: #ffffff;
          color: #991b1b;
          box-shadow: 0 3px 8px rgba(0,0,0,0.2);
          font-weight: 800;
        }
        .signature-review-box {
          width: 100%;
          background: var(--card);
          border-radius: 24px;
          padding: 18px;
          box-sizing: border-box;
          border: 1px solid var(--ln);
          box-shadow: 0 14px 34px var(--sh);
          margin-bottom: 16px;
          text-align: left;
          border-top: 4px solid #ffffff;
          color: var(--tx);
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
          color: var(--mu);
          text-transform: uppercase;
        }
        .dot-ping {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ef4444;
        }
        .top-rewrite-btn {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--soft);
          border: 1px solid var(--ln);
          color: var(--ac);
          font-size: 10.5px;
          font-weight: 650;
          cursor: pointer;
        }
        .review-display-zone {
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 2px 8px;
        }
        .loader-shimmer-wrap {
          color: var(--ac);
          font-size: 12px;
          font-style: italic;
        }
        .review-body-text {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--tx);
          margin: 0;
          width: 100%;
          white-space: pre-wrap;
        }
        .review-placeholder {
          font-family: Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: var(--mu);
          margin: 0;
        }
        .review-error {
          font-size: 12px;
          color: var(--err);
          margin: 0;
        }
        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: var(--ac);
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
          color: #ef4444;
          font-size: 7px;
          margin: 6px 0 10px;
        }
        .full-luxury-copy-btn {
          width: 100%;
          height: 50px;
          border-radius: 999px;
          background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
          border: none;
          color: #991b1b;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(0,0,0,0.3);
          transition: transform 0.15s ease;
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
          color: var(--mu);
          text-align: center;
          margin: 8px 0 0;
          font-style: italic;
        }
        .quick-actions-card {
          width: 100%;
          background: var(--card);
          border-radius: 22px;
          padding: 18px 12px;
          box-sizing: border-box;
          border: 1px solid var(--ln);
          box-shadow: 0 10px 28px var(--sh);
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
          gap: 18px;
          width: 100%;
        }
        .soft-circle-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          text-decoration: none !important;
          color: var(--tx2);
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
          background: var(--soft);
          display: grid;
          place-items: center;
          box-shadow: 0 6px 16px var(--sh);
          border: 1px solid var(--ln);
          transition: all 0.2s ease;
        }
        .icon-disc svg {
          width: 20px;
          height: 20px;
          stroke: var(--ic);
          transition: stroke 0.2s ease;
        }
        .whatsapp-disc:hover { background: #25d366; border-color: #25d366; }
        .whatsapp-disc:hover svg { stroke: #ffffff; }

        .call-disc:hover { background: #007aff; border-color: #007aff; }
        .call-disc:hover svg { stroke: #ffffff; }

        .contact-disc:hover { background: #ef4444; border-color: #ef4444; }
        .contact-disc:hover svg { stroke: #ffffff; }

        .map-disc:hover { background: #ea4335; border-color: #ea4335; }
        .map-disc:hover svg { stroke: #ffffff; }

        .insta-disc:hover { background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%); border-color: transparent; }
        .insta-disc:hover svg { stroke: #ffffff; }

        .fb-disc:hover { background: #1877f2; border-color: #1877f2; }
        .fb-disc:hover svg { stroke: #ffffff; }

        .icon-tag {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--tx2);
        }
        .embedded-map-card {
          width: 100%;
          background: var(--card);
          border-radius: 22px;
          padding: 14px 16px;
          box-sizing: border-box;
          border: 1px solid var(--ln);
          box-shadow: 0 8px 24px var(--sh);
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
          color: var(--tx);
          margin-bottom: 8px;
        }
        .map-iframe-container {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--ln);
          margin-bottom: 8px;
        }
        .map-directions-link {
          font-size: 11px;
          font-weight: 750;
          color: var(--ac);
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 8px;
        }
        .address-highlight-box {
          background: var(--soft);
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid var(--ln);
          margin-bottom: 8px;
        }
        .agency-clean-address {
          font-size: 10.5px;
          color: var(--tx2);
          margin: 0;
          line-height: 1.4;
          text-align: center;
        }
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
          border: 1px solid var(--ln);
          border-radius: 999px;
          background: var(--card);
          font-size: 8.5px;
          letter-spacing: 0.3px;
          color: var(--mu);
          line-height: 1.4;
        }
        .mini-footer-pill strong {
          color: #fca5a5;
          font-weight: 700;
        }
        .mini-footer-dot {
          color: #ef4444;
        }
        .mini-footer-pill a {
          color: #fca5a5;
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
