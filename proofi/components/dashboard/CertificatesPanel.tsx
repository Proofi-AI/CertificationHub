"use client";

import { useState } from "react";
import type { Certificate } from "@prisma/client";
import CertificateCard from "./CertificateCard";
import CertificateFormModal from "./CertificateFormModal";

interface Props {
  initialCertificates: Certificate[];
}

export default function CertificatesPanel({ initialCertificates }: Props) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Certificate | null>(null);

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (cert: Certificate) => { setEditTarget(cert); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSave = (cert: Certificate) => {
    setCertificates((prev) => {
      const idx = prev.findIndex((c) => c.id === cert.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cert;
        return next;
      }
      return [cert, ...prev];
    });
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setCertificates((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/certificates/${id}`, { method: "DELETE" });
  };

  const handleVisibilityToggle = async (id: string, isPublic: boolean) => {
    // Optimistic update
    setCertificates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPublic } : c))
    );
    const res = await fetch(`/api/certificates/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) {
      // Revert on failure
      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPublic: !isPublic } : c))
      );
    }
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-lg">Certificates</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {certificates.length} certificate{certificates.length !== 1 ? "s" : ""}
            {" · "}
            {certificates.filter((c) => c.isPublic).length} public
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add certificate
        </button>
      </div>

      {/* Empty state */}
      {certificates.length === 0 && (
        <div className="glass rounded-2xl border border-white/8 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-blue-500/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h3 className="font-semibold text-base mb-1">No certificates yet</h3>
          <p className="text-white/40 text-sm mb-5 max-w-xs mx-auto leading-relaxed">
            Add your first certificate to start building your public profile.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add your first certificate
          </button>
        </div>
      )}

      {/* Grid */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onEdit={openEdit}
              onDelete={handleDelete}
              onVisibilityToggle={handleVisibilityToggle}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <CertificateFormModal
          initialData={editTarget}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
