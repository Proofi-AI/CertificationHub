"use client";

import { useEffect, useState } from "react";

type FeedbackItem = {
  id: string;
  type: string;
  name: string | null;
  message: string;
  email: string | null;
  priority: string | null;
  imageUrl: string | null;   // camelCase from Prisma
  status: string;
  createdAt: string;         // camelCase from Prisma
  metadata: Record<string, string>;
};

type AdminEntry = { email: string; name: string | null; createdAt: string };

const TYPE_STYLES: Record<string, string> = {
  bug: "bg-orange-500/10 text-orange-300 border border-orange-500/20",
  feature: "bg-violet-500/10 text-violet-300 border border-violet-500/20",
  general: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
  "in-progress": "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  resolved: "bg-green-500/10 text-green-300 border border-green-500/20",
};

export default function AdminFeedbackClient() {
  const [tab, setTab] = useState<"inbox" | "admins">("inbox");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [preview, setPreview] = useState<FeedbackItem | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminMsg, setAdminMsg] = useState("");

  const fetchFeedbacks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/feedback?${params}`);
    const json = await res.json();
    setFeedbacks(json.feedbacks ?? []);
    setLoading(false);
  };

  const fetchAdmins = async () => {
    const res = await fetch("/api/admin");
    const json = await res.json();
    setAdmins(json.admins ?? []);
  };

  useEffect(() => { fetchFeedbacks(); }, [typeFilter, statusFilter]);
  useEffect(() => { if (tab === "admins") fetchAdmins(); }, [tab]);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/feedback", { method: "PATCH", body: JSON.stringify({ id, status }), headers: { "Content-Type": "application/json" } });
    fetchFeedbacks();
    setPreview(null);
  };

  const grantAdmin = async () => {
    if (!newAdminEmail) return;
    const res = await fetch("/api/admin", { method: "POST", body: JSON.stringify({ email: newAdminEmail }), headers: { "Content-Type": "application/json" } });
    const json = await res.json();
    if (res.ok) { setAdminMsg("✓ Admin granted!"); setNewAdminEmail(""); fetchAdmins(); }
    else setAdminMsg(`Error: ${json.error}`);
    setTimeout(() => setAdminMsg(""), 3000);
  };

  const revokeAdmin = async (email: string) => {
    await fetch("/api/admin", { method: "DELETE", body: JSON.stringify({ email }), headers: { "Content-Type": "application/json" } });
    fetchAdmins();
  };

  // Add back-to-dashboard header button
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f1225 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard"
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group shrink-0">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </a>
            <span className="text-white/10">/</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Feedback Inbox</h1>
              <p className="text-white/40 text-sm mt-0.5 hidden sm:block">Review and manage all customer feedback</p>
            </div>
          </div>
          <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button onClick={() => setTab("inbox")}
              className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === "inbox" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
              📥 Inbox
              {feedbacks.length > 0 && <span className="ml-2 bg-violet-500/30 text-violet-300 text-xs px-2 py-0.5 rounded-full">{feedbacks.length}</span>}
            </button>
            <button onClick={() => setTab("admins")}
              className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === "admins" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>
              👥 Admins
            </button>
          </div>
        </div>

        {/* INBOX TAB */}
        {tab === "inbox" && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none">
                <option value="all" className="bg-[#0f1225]">All Types</option>
                <option value="bug" className="bg-[#0f1225]">🐛 Bug</option>
                <option value="feature" className="bg-[#0f1225]">💡 Feature</option>
                <option value="general" className="bg-[#0f1225]">💬 General</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none">
                <option value="all" className="bg-[#0f1225]">All Status</option>
                <option value="open" className="bg-[#0f1225]">🟡 Open</option>
                <option value="in-progress" className="bg-[#0f1225]">🔵 In Progress</option>
                <option value="resolved" className="bg-[#0f1225]">✅ Resolved</option>
              </select>
              <button onClick={fetchFeedbacks}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white hover:bg-white/10 transition-all">
                🔄 Refresh
              </button>
            </div>

            {/* Mobile Cards / Desktop Table */}
            <div className="rounded-3xl border border-white/10 overflow-hidden" style={{ background: "rgba(19,22,39,0.8)" }}>
              {loading ? (
                <div className="py-20 text-center text-white/30 text-sm">Loading…</div>
              ) : feedbacks.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-4xl mb-4">📭</p>
                  <p className="text-white/40 text-sm">No feedback found</p>
                </div>
              ) : (
                <>
                  {/* Mobile card list */}
                  <div className="divide-y divide-white/[0.04] md:hidden">
                    {feedbacks.map((item) => (
                      <div key={item.id} className="p-4 cursor-pointer hover:bg-white/[0.03] transition-colors" onClick={() => setPreview(item)}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 text-xs rounded-lg font-bold uppercase ${TYPE_STYLES[item.type] ?? "bg-white/10 text-white/60"}`}>
                              {item.type}
                            </span>
                            <span className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize ${STATUS_STYLES[item.status] ?? "bg-white/10 text-white/50"}`}>
                              {item.status}
                            </span>
                            {item.priority && (
                              <span className={`text-xs font-semibold capitalize ${PRIORITY_STYLES[item.priority] ?? "text-white/40"}`}>
                                {item.priority}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/30 shrink-0">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white/80 truncate">{item.name ?? item.message}</p>
                        <p className="text-xs text-white/30 mt-0.5 truncate">{item.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-xs text-white/50">{item.name ?? "Anonymous"}</span>
                            {item.email && <span className="text-xs text-white/25 ml-1">· {item.email}</span>}
                          </div>
                          {item.imageUrl && (
                            <a href={item.imageUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                              className="text-xs text-violet-400 hover:text-violet-300 font-medium">
                              📷 Screenshot
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <table className="w-full text-sm hidden md:table">
                    <thead>
                      <tr className="text-xs text-white/30 uppercase tracking-wider border-b border-white/5">
                        <th className="px-6 py-4 text-left font-semibold">Type</th>
                        <th className="px-6 py-4 text-left font-semibold">From</th>
                        <th className="px-6 py-4 text-left font-semibold">Summary</th>
                        <th className="px-6 py-4 text-left font-semibold">Priority</th>
                        <th className="px-6 py-4 text-left font-semibold">Status</th>
                        <th className="px-6 py-4 text-left font-semibold">Date</th>
                        <th className="px-6 py-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {feedbacks.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => setPreview(item)}>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs rounded-lg font-bold uppercase ${TYPE_STYLES[item.type] ?? "bg-white/10 text-white/60"}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-white/90 text-sm">{item.name ?? "Anonymous"}</div>
                            <div className="text-xs text-white/30 mt-0.5">{item.email ?? "No email"}</div>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="font-medium text-white/80 truncate">{item.name ?? item.message}</p>
                            <p className="text-xs text-white/30 mt-0.5 truncate">{item.message}</p>
                          </td>
                          <td className="px-6 py-4">
                            {item.priority ? (
                              <span className={`font-semibold capitalize text-xs ${PRIORITY_STYLES[item.priority] ?? "text-white/40"}`}>
                                {item.priority}
                              </span>
                            ) : <span className="text-white/20 text-xs">–</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize ${STATUS_STYLES[item.status] ?? "bg-white/10 text-white/50"}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-white/40">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            <div className="text-white/20 mt-0.5">
                              {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {item.imageUrl && (
                              <a href={item.imageUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                className="text-xs text-violet-400 hover:text-violet-300 underline font-medium block mb-1">
                                📷 Screenshot
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </>
        )}

        {/* ADMINS TAB */}
        {tab === "admins" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Admins */}
            <div className="rounded-3xl border border-white/10 overflow-hidden" style={{ background: "rgba(19,22,39,0.8)" }}>
              <div className="px-6 py-5 border-b border-white/5">
                <h3 className="font-bold text-white">Current Admins</h3>
                <p className="text-xs text-white/40 mt-1">These users have inbox access</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {admins.map((a) => (
                  <div key={a.email} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{a.email}</p>
                      {a.name && <p className="text-xs text-white/30 mt-0.5">{a.name}</p>}
                      {a.email === "proofi.ai26@gmail.com" && (
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Default Admin</span>
                      )}
                    </div>
                    {a.email !== "proofi.ai26@gmail.com" && (
                      <button onClick={() => revokeAdmin(a.email)}
                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors font-semibold">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Grant Admin */}
            <div className="rounded-3xl border border-white/10 p-6" style={{ background: "rgba(19,22,39,0.8)" }}>
              <h3 className="font-bold text-white mb-1">Grant Admin Access</h3>
                <p className="text-xs text-white/40 mb-5">User must have an account already. Enter their email:</p>
              <div className="space-y-3">
                <input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)}
                  type="email" placeholder="colleague@example.com"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-all" />
                <button onClick={grantAdmin}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all">
                  Grant Admin
                </button>
                {adminMsg && <p className="text-center text-sm text-emerald-400">{adminMsg}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md" onClick={() => setPreview(null)}>
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh]"
            style={{ background: "linear-gradient(135deg, #1a1f35 0%, #131627 100%)" }}
            onClick={e => e.stopPropagation()}>

            <div className="relative p-5 sm:p-6 border-b border-white/5">
              <button onClick={() => setPreview(null)} className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center">✕</button>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1.5 text-xs rounded-xl font-bold uppercase ${TYPE_STYLES[preview.type] ?? ""}`}>{preview.type}</span>
                <span className={`px-3 py-1.5 text-xs rounded-xl font-medium capitalize ${STATUS_STYLES[preview.status] ?? ""}`}>{preview.status}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-3 pr-8">{preview.name ?? "No subject"}</h3>
            </div>

            <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              {/* From */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/[0.04] rounded-2xl p-4">
                  <p className="text-xs text-white/30 mb-1 font-semibold uppercase tracking-wider">From</p>
                  <p className="text-sm text-white font-medium">{preview.name ?? "Anonymous"}</p>
                  <p className="text-xs text-white/40">{preview.email ?? "No email"}</p>
                </div>
                <div className="bg-white/[0.04] rounded-2xl p-4">
                  <p className="text-xs text-white/30 mb-1 font-semibold uppercase tracking-wider">Submitted</p>
                  <p className="text-sm text-white">{new Date(preview.createdAt).toLocaleString()}</p>
                  {preview.priority && (
                    <p className={`text-xs font-semibold mt-1 capitalize ${PRIORITY_STYLES[preview.priority]}`}>
                      {preview.priority} priority
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="bg-white/[0.04] rounded-2xl p-4">
                <p className="text-xs text-white/30 mb-2 font-semibold uppercase tracking-wider">Message</p>
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{preview.message}</p>
              </div>

              {/* Screenshot */}
              {preview.imageUrl && (
                <div className="bg-white/[0.04] rounded-2xl p-4">
                  <p className="text-xs text-white/30 mb-3 font-semibold uppercase tracking-wider">Screenshot</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.imageUrl} alt="Screenshot" className="w-full rounded-xl object-cover max-h-64" />
                  <a href={preview.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:text-violet-300 mt-2 block">View Full Image →</a>
                </div>
              )}

              {/* Metadata */}
              {preview.metadata && Object.keys(preview.metadata).length > 0 && (
                <div className="bg-white/[0.04] rounded-2xl p-4">
                  <p className="text-xs text-white/30 mb-2 font-semibold uppercase tracking-wider">Technical Info</p>
                  <div className="space-y-1.5">
                    {Object.entries(preview.metadata).map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-xs">
                        <span className="text-white/30 capitalize w-24 flex-shrink-0">{k}</span>
                        <span className="text-white/60 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div>
                <p className="text-xs text-white/30 mb-3 font-semibold uppercase tracking-wider">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["open", "in-progress", "resolved"].map((s) => (
                    <button key={s} onClick={() => updateStatus(preview.id, s)}
                      disabled={preview.status === s}
                      className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
                        preview.status === s
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
