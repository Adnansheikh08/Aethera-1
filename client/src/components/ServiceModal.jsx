import { useEffect, useId, useRef } from "react";

import { Prose } from "./Prose.jsx";
import { fastScrollToElement } from "../hooks/useNavigation.js";

/**
 * A service card's "Detail" link opens this instead of routing to
 * /services/<slug>, so reading one capability never costs the reader their place
 * in the page.
 *
 * Native <dialog> rather than a hand-rolled overlay: showModal() promotes the
 * panel to the top layer (so it clears the sticky header and the cookie banner
 * without entering the z-index race), makes the rest of the document inert,
 * keeps Tab inside the panel and binds Escape. Every one of those is something a
 * div-based dialog gets subtly wrong.
 *
 * The landing payload already carries each service's full `description`, so the
 * dialog opens with the copy in hand — no request, and no loading state to
 * design around.
 */
export function ServiceModal({ service, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  // showModal() needs the node in the document, so it waits for the effect.
  useEffect(() => {
    dialogRef.current?.showModal();
    // Browsers hold the page still behind a modal dialog; this mirrors the
    // preloader's lock so the ones that don't behave the same way.
    document.body.classList.add("is-locked");
    return () => document.body.classList.remove("is-locked");
  }, []);

  const close = () => dialogRef.current?.close();

  /**
   * The contact form is behind this dialog, so the jump has to wait for the
   * dialog to be gone — scrolling while the body is still locked does nothing.
   * close() unmounts this component, and the next frame is the earliest the lock
   * has been lifted.
   */
  function goToContact(event) {
    event.preventDefault();
    close();
    requestAnimationFrame(() => {
      const contactSection = document.getElementById("contact-section");
      if (contactSection) fastScrollToElement(contactSection);
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="service-modal"
      aria-labelledby={titleId}
      /* `close` fires for every way out — Escape, either button, the backdrop —
         so the unmount is wired once here rather than at each call site. */
      onClose={onClose}
      /* The panel is the dialog's only child and fills it edge to edge, so a
         click that lands on the dialog itself came from the backdrop. */
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <article className="service-modal-card">
        <button type="button" className="service-modal-close" onClick={close}>
          <span aria-hidden="true">&times;</span>
          <span className="visually-hidden">Close</span>
        </button>

        <p className="eyebrow">Service Capability</p>
        <h2 id={titleId} className="service-modal-title">
          {service.title}
        </h2>
        <p className="service-modal-lead">{service.short_description}</p>

        <div className="prose service-modal-prose">
          <Prose text={service.description} />
        </div>

        <div className="service-modal-actions">
          <a href="#contact-section" className="cta-button btn-primary" onClick={goToContact}>
            Request capability deck
          </a>
          <button type="button" className="cta-button btn-secondary" onClick={close}>
            Close
          </button>
        </div>
      </article>
    </dialog>
  );
}
