"use client";

import { useState } from "react";

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hover:text-white/60 transition-colors"
      >
        Disclaimer
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "#0f0f18", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h2 className="text-base font-semibold text-white">Disclaimer</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4 text-sm text-white/55 leading-relaxed">
              <p>
                <strong className="text-white/80">Last updated: 2026</strong>
              </p>

              <p>
                Proofi Hub (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an independently developed, non-commercial project
                created for personal and educational purposes. By accessing or using the Platform, you
                acknowledge and agree to the terms set out in this disclaimer.
              </p>

              <p>
                <strong className="text-white/80">Data Access</strong><br />
                All data submitted to the Platform — including but not limited to your name, email address,
                uploaded certificate images, profile information, and any other content — is stored on
                third-party infrastructure and may be accessed, reviewed, or processed by the development
                team at any time. By using this Platform, you explicitly consent to this access. Do not
                upload any documents or information that you consider strictly confidential.
              </p>

              <p>
                <strong className="text-white/80">No Warranty</strong><br />
                The Platform is provided &ldquo;as is&rdquo; without any warranty of any kind, express or implied.
                We make no guarantees regarding uptime, data retention, accuracy, or fitness for any
                particular purpose. The Platform may be modified, paused, or discontinued at any time
                without notice.
              </p>

              <p>
                <strong className="text-white/80">Limitation of Liability</strong><br />
                To the fullest extent permitted by applicable law, the developers of Proofi Hub shall not
                be liable for any direct, indirect, incidental, consequential, or punitive damages arising
                from your use of or inability to use the Platform, including any loss of data.
              </p>

              <p>
                <strong className="text-white/80">Third-Party Services</strong><br />
                The Platform relies on third-party services including Supabase for authentication and
                storage, and Vercel for hosting. Your use of these services is also subject to their
                respective terms and privacy policies. We are not responsible for any actions taken by
                these providers.
              </p>

              <p>
                <strong className="text-white/80">Not a Commercial Product</strong><br />
                Proofi Hub is not a registered company or commercial service. It is a personal project
                and should not be relied upon for any professional, legal, or business-critical use.
                We make no claims regarding compliance with any data protection regulation including
                GDPR, CCPA, or similar frameworks.
              </p>

              <p>
                <strong className="text-white/80">Your Responsibility</strong><br />
                You are solely responsible for the content you upload. Do not upload certificates or
                information belonging to others without their explicit consent. We reserve the right
                to remove any content at our discretion.
              </p>

              <p>
                By continuing to use the Platform, you acknowledge that you have read, understood, and
                agreed to this disclaimer in its entirety.
              </p>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 flex justify-start"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-xl transition-all text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
