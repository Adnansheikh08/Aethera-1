import { useCallback, useEffect, useRef } from "react";

import { useReducedMotion } from "./useReducedMotion.js";

const TILT_INTENSITY = 12; // Maximum tilt angle in degrees
const GLARE_OPACITY = 0.15;

/**
 * Interactive 3D card tilt effect.
 *
 * Tracks pointer movement over a card and tilts it in 3D space, creating an
 * engaging parallax depth effect. The tilt responds to cursor position and
 * resets on mouse leave.
 *
 * Styles are written directly to the node rather than held in state: the source
 * updated on every mousemove with no throttling, and routing that through React
 * would add a commit per pointer event.
 *
 * DEVIATION FROM SOURCE: the vanilla module bound the effect unconditionally.
 * Here it is gated behind `prefers-reduced-motion`, per the shared motion
 * contract every other module already honoured. Under reduced motion no
 * listeners are attached and no transform is ever written.
 */
export const useCardTilt = ({ intensity = TILT_INTENSITY, glareOpacity = GLARE_OPACITY } = {}) => {
    const reducedMotion = useReducedMotion();
    const cardRef = useRef(null);

    const reset = useCallback((node) => {
        if (!node) {
            return;
        }

        // Empty string, not "none" — the stylesheet's own values take back over.
        node.style.transform = "";
        node.style.background = "";
    }, []);

    useEffect(() => {
        const card = cardRef.current;

        if (!card || reducedMotion) {
            reset(card);
            return undefined;
        }

        const handleMouseMove = (event) => {
            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation based on cursor distance from center
            const rotateX = ((y - centerY) / centerY) * -intensity;
            const rotateY = ((x - centerX) / centerX) * intensity;

            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateZ(10px)
                scale3d(1.02, 1.02, 1.02)
            `;

            // Add subtle glare effect
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;

            card.style.background = `
                radial-gradient(
                    circle at ${glareX}% ${glareY}%,
                    rgba(255, 255, 255, ${glareOpacity}),
                    transparent 50%
                ),
                var(--bg-surface)
            `;
        };

        const handleMouseLeave = () => reset(card);

        card.addEventListener("mousemove", handleMouseMove);
        card.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            card.removeEventListener("mousemove", handleMouseMove);
            card.removeEventListener("mouseleave", handleMouseLeave);
            // A card unmounting mid-hover must not leave a tilt baked in.
            reset(card);
        };
    }, [reducedMotion, intensity, glareOpacity, reset]);

    return cardRef;
};

export default useCardTilt;
