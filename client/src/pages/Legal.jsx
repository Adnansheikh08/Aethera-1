import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

/** Ported from templates/legal/privacy-policy.html. */
export function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Aethera</title>
        <meta name="description" content="Aethera's Privacy Policy outlines how we collect, protect, and manage your personal data with GDPR and DPDP compliance." />
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Legal Compliance</p>
        <h1 id="privacy-heading" className="page-title">
          Privacy Policy
        </h1>
      </header>

      <section className="container" aria-labelledby="privacy-heading">
        <div className="prose">
          <p>
            <em>Last updated: 13 August 2026</em>
          </p>

          <h2>1. Introduction</h2>
          <p>
            At Aethera, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you visit our website and use our services. 
            We are committed to maintaining the highest standards of data protection and compliance with 
            global privacy regulations, including GDPR (EU) and the Digital Personal Data Protection (DPDP) 
            Act (India).
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We collect information you voluntarily provide through our inquiry form, including:
          </p>
          <ul>
            <li>Full name</li>
            <li>Email address (work/business)</li>
            <li>Phone number</li>
            <li>Service type and project brief</li>
          </ul>
          <p>
            We do not collect sensitive personal data, financial information, or biometric data. 
            All data collection is transparent and purposeful.
          </p>

          <h2>3. Data Storage &amp; Encryption Standard</h2>
          <p>
            All personal data is stored exclusively in encrypted form using industry-standard 
            <strong> AES-256 encryption</strong>. Database fields are cryptographically protected 
            via hardware-backed key rings, preventing unauthorised local data read operations even 
            from compromised database access.
          </p>
          <p>
            Data is stored in secure, ISO 27001-aligned facilities. We never store passwords in plaintext 
            and use bcryptjs for all password hashing with salted iterations.
          </p>

          <h2>4. Data Usage &amp; Purpose</h2>
          <p>
            We use your personal data exclusively for:
          </p>
          <ul>
            <li>Processing and responding to your inquiry</li>
            <li>Contacting you regarding your service request</li>
            <li>Improving our services and user experience</li>
            <li>Complying with legal obligations</li>
          </ul>
          <p>
            We do not sell, trade, or rent your personal information to third parties under any circumstances.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your personal data only as long as necessary to fulfill the purposes for which 
            it was collected, typically 2 years from the date of last contact. After this period, 
            data is securely destroyed. You may request deletion at any time by contacting us at{" "}
            <a href="mailto:mohammadharoonu@gmail.com">mohammadharoonu@gmail.com</a>.
          </p>

          <h2>6. Your Privacy Rights (GDPR &amp; DPDP Act)</h2>
          <p>
            You have the following rights regarding your personal data:
          </p>
          <ul>
            <li><strong>Right of Access:</strong> Obtain a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Right to Erasure:</strong> Request immediate deletion of your data</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Right to Object:</strong> Opt-out of specific data processing activities</li>
          </ul>
          <p>
            To exercise any of these rights, contact us directly at <a href="mailto:mohammadharoonu@gmail.com">mohammadharoonu@gmail.com</a>.
          </p>

          <h2>7. Cookie Consents &amp; Tracking</h2>
          <p>
            Our website uses minimal, essential cookies:
          </p>
          <ul>
            <li><strong>Session cookies:</strong> HTTP-only, secure flags enabled, cleared on browser close</li>
            <li><strong>Authentication tokens:</strong> Securely stored with httpOnly and Secure attributes</li>
          </ul>
          <p>
            We do <strong>not</strong> engage in third-party marketing tracking, analytics cookies, or 
            behavioural profiling without your explicit granular consent. You control cookie preferences 
            via our consent banner on first visit.
          </p>

          <h2>8. Security Measures</h2>
          <p>
            Aethera implements comprehensive security controls:
          </p>
          <ul>
            <li>OWASP ASVS Level 3 hardening standard</li>
            <li>Content Security Policy (CSP) with nonce-based headers</li>
            <li>Web Application Firewall (WAF) protection</li>
            <li>Rate limiting and IP ban policies</li>
            <li>Helmet.js security headers</li>
            <li>TLS 1.2+ encryption for all data in transit</li>
            <li>Regular security audits and penetration testing</li>
          </ul>
          <p>
            No security system is impenetrable. If you believe your data has been compromised, 
            contact us immediately.
          </p>

          <h2>9. Third-Party Services &amp; Sub-Processors</h2>
          <p>
            We use limited third-party services and data sub-processors only when essential:
          </p>
          <ul>
            <li><strong>Email Service:</strong> For inquiry notifications and communications (compliant with GDPR/DPDP)</li>
            <li><strong>Payment Processor:</strong> Stripe (when applicable) — PCI-DSS Level 1 compliant</li>
            <li><strong>Cloud Hosting:</strong> Secure, ISO 27001-certified data centres</li>
            <li><strong>Database Services:</strong> MongoDB Atlas — encrypted at rest and in transit</li>
          </ul>
          <p>
            All third-party processors and sub-processors are contractually bound to:
          </p>
          <ul>
            <li>GDPR Article 28 Data Processing Agreements (DPA)</li>
            <li>DPDP Act compliance requirements</li>
            <li>Standard Contractual Clauses (SCCs) for international transfers</li>
            <li>Confidentiality and security obligations</li>
          </ul>
          <p>
            A complete list of current sub-processors is available upon request. We notify you of any 
            material changes to our sub-processor list before implementing changes.
          </p>

          <h2>10. Children &amp; Minors</h2>
          <p>
            Our services are not intended for individuals under 18 years of age. We do not knowingly 
            collect data from minors. If we become aware that a minor has provided personal data, 
            we will delete it immediately.
          </p>

          <h2>11. International Data Transfers</h2>
          <p>
            If your data is transferred internationally, we ensure equivalent or greater protection 
            standards apply. EU residents' data is protected under Standard Contractual Clauses (SCCs) 
            or equivalent mechanisms.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Material changes will be notified to you via 
            email or prominent website notice. Your continued use of our services indicates acceptance 
            of updated terms.
          </p>

          <h2>13. Data Processing Agreement (DPA)</h2>
          <p>
            For clients requiring a formal Data Processing Agreement (DPA) under GDPR Article 28 or DPDP Act, 
            we provide standard DPA templates that align with EU Standard Contractual Clauses. The DPA specifies:
          </p>
          <ul>
            <li>Scope and type of personal data processing</li>
            <li>Duration, nature, and purpose of processing</li>
            <li>Security measures and sub-processor policies</li>
            <li>Data subject rights and audit procedures</li>
            <li>Data breach notification procedures</li>
          </ul>
          <p>
            Contact us to request a DPA for your engagement.
          </p>

          <h2>14. Contact &amp; Complaints</h2>
          <p>
            For privacy inquiries, data requests, or to lodge a complaint:
          </p>
          <ul>
            <li>
              Email: <a href="mailto:mohammadharoonu@gmail.com">mohammadharoonu@gmail.com</a>
            </li>
            <li>
              Phone: <a href="tel:+917985765985">+91 79857 65985</a>
            </li>
          </ul>
          <p>
            If you are unsatisfied with our response, you have the right to lodge a complaint with your 
            local data protection authority:
          </p>
          <ul>
            <li><strong>EU:</strong> Your national Data Protection Authority (DPA)</li>
            <li><strong>India:</strong> Data Protection Board of India (DPBI) or State DPA authorities</li>
          </ul>
        </div>
      </section>
    </>
  );
}

/** Ported from templates/legal/terms.html. */
export function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Aethera</title>
        <meta name="description" content="Aethera Terms of Service outline the conditions for using our services, including liability, warranties, and service expectations." />
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Legal Definition</p>
        <h1 id="terms-heading" className="page-title">
          Terms of Service
        </h1>
      </header>

      <section className="container" aria-labelledby="terms-heading">
        <div className="prose">
          <p>
            <em>Last updated: 13 August 2026</em>
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Aethera Agency's website and services, you acknowledge that you have 
            read, understood, and agree to be bound by these Terms of Service. If you do not agree to 
            these terms, please do not use our services.
          </p>

          <h2>2. Service Definition</h2>
          <p>
            Aethera Agency provides specialised services in the following areas:
          </p>
          <ul>
            <li><strong>Cybersecurity Architecture Audits:</strong> Threat modelling, penetration testing, and security assessments</li>
            <li><strong>Enterprise Software Engineering:</strong> Full-stack development, API design, and system architecture</li>
            <li><strong>Digital Campaigns:</strong> Marketing strategy, brand development, and campaign execution</li>
            <li><strong>Post-Production Services:</strong> Video editing, color grading, sound design, and media delivery</li>
          </ul>
          <p>
            The specific scope of work, deliverables, timelines, and acceptance criteria for each engagement 
            are defined in a separate Statement of Work (SOW) that shall be executed before service commencement.
          </p>

          <h2>3. Eligibility</h2>
          <p>
            Our services are offered to individuals and organisations that are:
          </p>
          <ul>
            <li>At least 18 years of age (or the age of majority in their jurisdiction)</li>
            <li>Legally authorised to enter into binding contracts</li>
            <li>Not located in jurisdictions subject to trade embargoes or sanctions</li>
          </ul>
          <p>
            By using our services, you represent and warrant that you meet these eligibility criteria.
          </p>

          <h2>4. Code Liability &amp; Warranties</h2>
          <p>
            Aethera executes comprehensive quality assurance processes including:
          </p>
          <ul>
            <li>OWASP ASVS Level 3 hardening standards</li>
            <li>Code scanning and static analysis</li>
            <li>Penetration testing and security audits</li>
            <li>Automated and manual testing before deployment</li>
          </ul>
          <p>
            <strong>Limitation of Liability:</strong> Despite these measures, the client assumes all 
            execution risks upon deployment of code to live production platforms. No software is 100% 
            secure, and we cannot guarantee freedom from all vulnerabilities. We provide best-effort 
            services within the scope of the SOW.
          </p>
          <p>
            <strong>Post-Delivery Support:</strong> Maintenance, bug fixes, and ongoing support are 
            subject to separate Service Level Agreements (SLAs) and may incur additional costs. 
            The SOW will specify what post-delivery support, if any, is included.
          </p>

          <h2>5. Payment Terms</h2>
          <p>
            Payment terms are defined in the SOW and may include:
          </p>
          <ul>
            <li><strong>Upfront deposit:</strong> Typically 50% of project cost to secure timeline</li>
            <li><strong>Milestone payments:</strong> Upon completion of defined project phases</li>
            <li><strong>Final payment:</strong> Due upon project completion and acceptance testing</li>
          </ul>
          <p>
            Invoices are payable within 30 days of issue unless otherwise specified. Late payment may 
            result in work suspension and applicable interest charges per agreed terms.
          </p>
          <p>
            All fees are exclusive of applicable taxes (GST, VAT, sales tax) unless explicitly stated 
            as inclusive.
          </p>

          <h2>6. Intellectual Property Rights</h2>
          <p>
            <strong>Client Work Product:</strong> Custom code, designs, and materials created specifically 
            for your project become your exclusive property upon full payment. You receive unrestricted 
            rights to use, modify, and distribute the work product.
          </p>
          <p>
            <strong>Aethera IP:</strong> Pre-existing tools, frameworks, templates, processes, and 
            methodologies remain Aethera's property. You receive a non-exclusive, royalty-free license 
            to use these as part of the deliverables.
          </p>
          <p>
            <strong>Third-Party Components:</strong> Open-source libraries and third-party components 
            retain their original licenses. You agree to comply with all applicable open-source license 
            terms (GPL, MIT, Apache, etc.).
          </p>

          <h2>7. Confidentiality</h2>
          <p>
            Both parties agree to treat confidential information received during the engagement with 
            appropriate care:
          </p>
          <ul>
            <li>Confidential information is disclosed in writing or clearly marked as confidential</li>
            <li>Information must be protected with reasonable security measures</li>
            <li>Confidentiality obligations persist for 3 years after project completion</li>
            <li>Exceptions: information already public, independently developed, or required by law</li>
          </ul>

          <h2>8. Limitation of Liability</h2>
          <p>
            <strong>Liability Cap:</strong> To the maximum extent permitted by law, Aethera's total 
            liability arising from these Terms or services shall not exceed the total fees paid by the 
            client in the 12 months preceding the claim.
          </p>
          <p>
            <strong>Excluded Damages:</strong> In no event shall Aethera be liable for indirect, 
            incidental, special, consequential, or punitive damages, including:
          </p>
          <ul>
            <li>Lost profits or revenue</li>
            <li>Loss of business opportunity</li>
            <li>Loss of data or reputation</li>
            <li>Business interruption</li>
          </ul>
          <p>
            This limitation applies regardless of the cause of action and even if advised of the 
            possibility of such damages.
          </p>

          <h2>9. Indemnification</h2>
          <p>
            <strong>By the Client:</strong> You agree to indemnify and hold harmless Aethera from any 
            claims arising from:
          </p>
          <ul>
            <li>Your use of the deliverables in ways not contemplated in the SOW</li>
            <li>Your modification of code or designs without our consent</li>
            <li>Your violation of third-party intellectual property rights</li>
            <li>Your breach of these Terms or the SOW</li>
          </ul>
          <p>
            <strong>By Aethera:</strong> Aethera indemnifies you against claims that the original 
            deliverables, as created and unmodified, infringe third-party intellectual property rights.
          </p>

          <h2>10. Project Changes &amp; Scope Creep</h2>
          <p>
            <strong>Change Request Process:</strong> Any changes to the scope, timeline, or deliverables 
            defined in the SOW must be requested in writing and approved by both parties before execution.
          </p>
          <p>
            <strong>Additional Costs:</strong> Out-of-scope changes typically incur additional fees. 
            Aethera will provide a revised estimate before proceeding with out-of-scope work.
          </p>
          <p>
            <strong>Timeline Impact:</strong> Scope changes may extend the project timeline. Revised 
            delivery dates will be agreed upon in writing.
          </p>

          <h2>11. Refund &amp; Cancellation Policy</h2>
          <p>
            <strong>Deposit &amp; Prepayments:</strong> Project deposits and upfront milestone payments are generally 
            non-refundable once work has commenced, as they secure dedicated resources and team availability.
          </p>
          <p>
            <strong>Early Termination by Client:</strong> If you terminate before project completion:
          </p>
          <ul>
            <li>You remain liable for all work completed up to the termination date</li>
            <li>You must pay for non-recoverable costs (licenses, third-party services, hosting setup)</li>
            <li>Partial refunds may apply for unused paid milestones if termination occurs before work begins</li>
            <li>The SOW will specify refund eligibility for each milestone</li>
          </ul>
          <p>
            <strong>Refund Process:</strong> Refund requests must be submitted in writing within 30 days of termination. 
            Approved refunds will be processed within 15 business days to the original payment method.
          </p>
          <p>
            <strong>No Refund Scenarios:</strong> No refunds are issued for:
          </p>
          <ul>
            <li>Work already completed and accepted by client</li>
            <li>Services rendered and deployed</li>
            <li>Non-refundable setup fees explicitly stated in SOW</li>
            <li>Termination due to client non-compliance with Terms</li>
          </ul>

          <h2>12. Survival of Terms</h2>
          <p>
            The following provisions shall survive termination or expiration of these Terms and any SOW:
          </p>
          <ul>
            <li><strong>Confidentiality (Section 7):</strong> 3 years post-termination</li>
            <li><strong>Intellectual Property Rights (Section 6):</strong> Perpetual</li>
            <li><strong>Limitation of Liability (Section 8):</strong> Perpetual</li>
            <li><strong>Indemnification (Section 9):</strong> For claims arising from pre-termination conduct</li>
            <li><strong>Governing Law &amp; Jurisdiction (Section 17):</strong> Perpetual</li>
            <li><strong>Payment Obligations (Section 5):</strong> For services rendered</li>
          </ul>
          <p>
            All other provisions shall expire upon project completion or termination unless otherwise specified.
          </p>

          <h2>13. Cybersecurity Services Disclaimer</h2>
          <p>
            For clients engaging Aethera for cybersecurity audits, penetration testing, or threat assessments:
          </p>
          <ul>
            <li><strong>No Guarantee:</strong> Security testing cannot guarantee elimination of all vulnerabilities</li>
            <li><strong>Testing Scope:</strong> Assessments are limited to the scope defined in the SOW and may not identify all vulnerabilities</li>
            <li><strong>Time-Limited Validity:</strong> Security assessments are accurate at the time of testing only; new vulnerabilities may emerge</li>
            <li><strong>Third-Party Code:</strong> We are not responsible for vulnerabilities in third-party libraries, frameworks, or dependencies unless explicitly scoped</li>
            <li><strong>Client Responsibility:</strong> Implementing remediation recommendations is the client's sole responsibility</li>
            <li><strong>Ongoing Security:</strong> Continued security requires ongoing monitoring, updates, and patching beyond the assessment</li>
          </ul>
          <p>
            Aethera provides professional security assessments in accordance with industry best practices but does not 
            warrant complete absence of security flaws.
          </p>

          <h2>14. Notice &amp; Communication</h2>
          <p>
            <strong>Official Notice:</strong> Any formal legal notice, claim, or communication under these Terms must be 
            sent in writing (email or registered mail) to:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:mohammadharoonu@gmail.com">mohammadharoonu@gmail.com</a></li>
            <li><strong>Mailing Address:</strong> Aethera Agency, Lucknow, Uttar Pradesh, India</li>
            <li><strong>Phone:</strong> <a href="tel:+917985765985">+91 79857 65985</a></li>
          </ul>
          <p>
            Notices sent via email are effective upon receipt. Notices sent via registered mail are effective 5 business 
            days after posting.
          </p>

          <h2>15. Accessibility Statement</h2>
          <p>
            Aethera is committed to providing accessible services and digital experiences compliant with:
          </p>
          <ul>
            <li>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</li>
            <li>Americans with Disabilities Act (ADA) standards</li>
            <li>Indian accessibility standards and requirements</li>
          </ul>
          <p>
            If you encounter accessibility barriers or require accommodations (e.g., screen reader compatibility, 
            alternative formats, accessibility services), please contact us immediately at{" "}
            <a href="mailto:mohammadharoonu@gmail.com">mohammadharoonu@gmail.com</a>.
          </p>
          <p>
            We actively work to identify and address accessibility issues. Your feedback helps us improve our services 
            for all users.
          </p>

          <h2>11. Termination</h2>
          <p>
            <strong>Termination for Convenience:</strong> Either party may terminate the engagement 
            with 30 days' written notice. The terminating party may owe payment for work completed 
            up to the termination date plus any non-recoverable costs incurred.
          </p>
          <p>
            <strong>Termination for Cause:</strong> Either party may terminate immediately if:
          </p>
          <ul>
            <li>The other party materially breaches these Terms and fails to cure within 15 days</li>
            <li>The other party becomes insolvent or files for bankruptcy</li>
            <li>The other party engages in illegal activity</li>
          </ul>

          <h2>12. Service Level Agreement (SLA)</h2>
          <p>
            For client projects requiring guaranteed service levels, the following SLA applies (unless modified in SOW):
          </p>
          <ul>
            <li><strong>Availability Target:</strong> 99.5% uptime measured monthly for production systems</li>
            <li><strong>Maintenance Windows:</strong> Scheduled maintenance max 4 hours/month, typically on Sundays 2-4 AM IST</li>
            <li><strong>Incident Response:</strong> Critical incidents acknowledged within 1 hour, updates every 4 hours</li>
            <li><strong>Bug Fix SLA:</strong> Critical bugs fixed within 48 hours; high-priority within 1 week</li>
          </ul>
          <p>
            Downtime caused by third-party service providers, client infrastructure, or external attacks 
            may not be counted against SLA credits.
          </p>

          <h2>13. Warranties &amp; Disclaimers</h2>
          <p>
            <strong>Disclaimer of Warranties:</strong> EXCEPT AS EXPRESSLY STATED IN THE SOW, AETHERA 
            PROVIDES SERVICES ON AN "AS-IS" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, 
            INCLUDING WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p>
            <strong>Service Availability:</strong> While we strive for high availability as specified in our SLA, 
            Aethera does not warrant uninterrupted service. Scheduled maintenance and unforeseen incidents may cause 
            temporary unavailability.
          </p>

          <h2>13. Security &amp; Data Protection</h2>
          <p>
            Aethera maintains industry-standard security practices as detailed in our Privacy Policy:
          </p>
          <ul>
            <li>AES-256 encryption for data at rest</li>
            <li>TLS 1.2+ for data in transit</li>
            <li>OWASP ASVS Level 3 hardening</li>
            <li>Web Application Firewall (WAF)</li>
            <li>Rate limiting and IP ban policies</li>
          </ul>
          <p>
            You are responsible for:
          </p>
          <ul>
            <li>Maintaining strong passwords and access credentials</li>
            <li>Protecting your authentication tokens</li>
            <li>Promptly notifying Aethera of any suspected security incidents</li>
          </ul>

          <h2>16. Prohibited Uses</h2>
          <p>
            You agree not to use our services for:
          </p>
          <ul>
            <li>Illegal activities or violations of local, state, or international law</li>
            <li>Harassment, threats, or defamation of others</li>
            <li>Intellectual property infringement or unauthorised access</li>
            <li>Distribution of malware, viruses, or harmful code</li>
            <li>Phishing, social engineering, or fraud</li>
            <li>Spam or unsolicited bulk communications</li>
            <li>Circumventing security controls or rate limits</li>
          </ul>
          <p>
            Violations may result in immediate termination of services and legal action.
          </p>

          <h2>17. Third-Party Services &amp; Links</h2>
          <p>
            Our website may contain links to third-party websites and services. Aethera:
          </p>
          <ul>
            <li>Does not endorse or guarantee third-party content or services</li>
            <li>Is not responsible for third-party privacy practices, terms, or security</li>
            <li>Does not control or monitor third-party websites</li>
          </ul>
          <p>
            Your use of third-party services is governed by their own terms and policies.
          </p>

          <h2>18. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms of Service are governed by the laws of India, without regard to conflict of law principles.
          </p>
          <p>
            Any legal action or proceeding arising from these Terms shall be brought exclusively in the 
            courts located in Lucknow, Uttar Pradesh, India. You consent to the jurisdiction and venue 
            of these courts.
          </p>

          <h2>19. Dispute Resolution</h2>
          <p>
            <strong>Informal Resolution:</strong> Before initiating formal proceedings, you agree to 
            attempt informal resolution by contacting us at{" "}
            <a href="mailto:mohammadharoonu@gmail.com">mohammadharoonu@gmail.com</a> with a detailed 
            description of the dispute.
          </p>
          <p>
            <strong>Escalation:</strong> If informal resolution fails within 30 days, either party may 
            pursue legal action in accordance with Section 16.
          </p>

          <h2>20. Force Majeure</h2>
          <p>
            Neither party shall be liable for failure or delay in performance under these Terms or any SOW caused by 
            events beyond their reasonable control, including but not limited to:
          </p>
          <ul>
            <li>Natural disasters (earthquakes, floods, hurricanes)</li>
            <li>War, terrorism, or civil unrest</li>
            <li>Pandemic or public health emergencies</li>
            <li>Government actions or sanctions</li>
            <li>Critical infrastructure failures (power outages, internet disruptions)</li>
            <li>Third-party service provider failures</li>
          </ul>
          <p>
            The affected party must provide prompt written notice and use reasonable efforts to mitigate impact and 
            resume performance. If a force majeure event prevents performance for more than 60 days, either party may 
            terminate the affected engagement with written notice.
          </p>

          <h2>21. Limitation Period &amp; Claims</h2>
          <p>
            <strong>Claim Period:</strong> Any claim arising from these Terms or an engagement must be initiated 
            within 2 years from the date the claimant knew or should have known of the claim. Claims filed after 
            this period are barred.
          </p>
          <p>
            <strong>Statute of Limitations:</strong> This limitation period does not apply to claims for indemnification 
            or intellectual property infringement, which shall be subject to applicable statutory limits.
          </p>
          <p>
            <strong>Notice:</strong> Any legal action must be brought in the jurisdiction specified in Section 16 and 
            within the time period specified here.
          </p>

          <h2>22. Modifications to Terms</h2>
          <p>
            Aethera reserves the right to modify these Terms at any time. Material changes will be 
            communicated via email or prominent website notice. Your continued use of our services 
            following notice of changes constitutes acceptance of modified terms.
          </p>
          <p>
            For ongoing contracts, significant modifications will not apply retroactively without 
            written consent.
          </p>

          <h2>23. Entire Agreement</h2>
          <p>
            These Terms of Service, along with any SOW or separate agreement, constitute the entire 
            agreement between you and Aethera regarding the services. They supersede all prior 
            understandings, negotiations, and agreements.
          </p>
          <p>
            If any provision is found unenforceable, the remaining provisions shall continue in full effect.
          </p>

          <h2>24. Contact Information</h2>
          <p>
            For questions about these Terms of Service:
          </p>
          <ul>
            <li>
              Email: <a href="mailto:mohammadharoonu@gmail.com">mohammadharoonu@gmail.com</a>
            </li>
            <li>
              Phone: <a href="tel:+917985765985">+91 79857 65985</a>
            </li>
            <li>
              Instagram: <a href="https://www.instagram.com/aethera09" target="_blank" rel="noopener noreferrer">@aethera09</a>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

/**
 * Django delegated unmatched URLs to its own 404 handler; the SPA owns routing
 * now, so the catch-all route renders this.
 */
export function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found — Aethera</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="page-header">
        <p className="eyebrow">Error 404</p>
        <h1 id="notfound-heading" className="page-title">
          Page not found
        </h1>
      </header>

      <section className="container" aria-labelledby="notfound-heading">
        <div className="prose">
          <p>That address does not resolve to anything on this site.</p>
          <div className="form-navigation">
            <Link to="/" className="cta-button btn-primary">
              Return to homepage
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

