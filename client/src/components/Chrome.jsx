import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { useScrollProgressValue } from "../hooks/useScrollProgress.js";
import { useCookieConsent } from "../hooks/useCookieConsent.js";

/**
 * Cinematic Glitch Matrix startup preloader.
 * It displays falling terminal characters, horizontal boot logs,
 * and a brand logo reveal before fading out.
 */
export function Preloader({ onComplete }) {
  const isReduced = useReducedMotion();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [bootText, setBootText] = useState("");
  const [isBrandVisible, setIsBrandVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isReduced) {
      onComplete();
      return;
    }

    const sequence = [
      { text: "[ SYSTEM INITIALIZING ]", delay: 0 },
      { text: "[ SECURITY PROTOCOLS LOADING ]", delay: 500 },
      { text: "[ ARCHITECTURE VERIFIED ]", delay: 1100 },
    ];

    const timers = [];

    sequence.forEach((step) => {
      const timer = setTimeout(() => {
        setBootText(step.text);
      }, step.delay);
      timers.push(timer);
    });

    const brandTimer = setTimeout(() => {
      setBootText("");
      setIsBrandVisible(true);
    }, 1700);
    timers.push(brandTimer);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2200);
    timers.push(fadeTimer);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);
    timers.push(completeTimer);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops = Array(columns).fill(0).map(() => Math.floor(Math.random() * -100));
    const chars = "0101010101ABCDEF$_%*#<>:".split("");

    const draw = () => {
      ctx.fillStyle = "rgba(4, 5, 8, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "Space Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        if (Math.random() > 0.98) {
          continue;
        }

        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const colorVal = Math.random();
        if (colorVal > 0.85) {
          ctx.fillStyle = "rgba(37, 99, 235, 0.35)"; // Electric blue
        } else if (colorVal > 0.70) {
          ctx.fillStyle = "rgba(6, 182, 212, 0.25)"; // Cyan
        } else {
          ctx.fillStyle = "rgba(16, 185, 129, 0.15)"; // Dim green
        }

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReduced, onComplete]);

  if (isReduced) return null;

  return (
    <div
      ref={containerRef}
      className={`preloader-overlay ${isFadingOut ? "is-fadeout" : ""}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="preloader-canvas" />
      <div className="preloader-scanlines" />
      <div className="preloader-content-wrapper">
        {bootText && <div className="preloader-boot-text">{bootText}</div>}
        <div className={`preloader-logo ${isBrandVisible ? "is-visible" : ""}`}>
          AETHERA<span className="orange-char">.</span>
        </div>
      </div>
    </div>
  );
}

export function ScrollProgress() {
  const progress = useScrollProgressValue();

  return (
    <div
      className="scroll-progress"
      data-scroll-progress=""
      aria-hidden="true"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
}

/**
 * Consent gate from base.html. Non-essential categories are opt-in and default
 * to unchecked; `enabled` defers the prompt until the intro has resolved, which
 * is what the vanilla composition root did by awaiting the preloader promise.
 */
export function CookieBanner({ enabled = true }) {
  const {
    isMounted,
    isVisible,
    selection,
    toggleCategory,
    acceptSelected,
    acceptEssentialOnly,
    bannerProps,
    className,
  } = useCookieConsent({ enabled });

  if (!isMounted) return null;

  return (
    <aside
      {...bannerProps}
      className={className}
      data-cookie-banner=""
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-heading"
      aria-describedby="cookie-copy"
      aria-hidden={isVisible ? undefined : "true"}
    >
      <div>
        <h2 className="footer-heading" id="cookie-heading">
          Cookie preferences
        </h2>
        <p className="cookie-copy" id="cookie-copy">
          Essential cookies keep this site secure and are always active. Choose whether we may also
          use analytics and marketing cookies.
        </p>
        <label className="cookie-option">
          <input
            type="checkbox"
            data-consent-category="analytics"
            checked={Boolean(selection.analytics)}
            onChange={(event) => toggleCategory("analytics", event.target.checked)}
          />{" "}
          Analytics
        </label>
        <label className="cookie-option">
          <input
            type="checkbox"
            data-consent-category="marketing"
            checked={Boolean(selection.marketing)}
            onChange={(event) => toggleCategory("marketing", event.target.checked)}
          />{" "}
          Marketing
        </label>
      </div>
      <div className="cookie-actions">
        <button
          type="button"
          className="cta-button btn-secondary"
          data-consent="essential"
          onClick={acceptEssentialOnly}
        >
          Essentials only
        </button>
        <button
          type="button"
          className="cta-button btn-primary"
          data-consent="accept"
          onClick={acceptSelected}
        >
          Save choices
        </button>
      </div>
    </aside>
  );
}
