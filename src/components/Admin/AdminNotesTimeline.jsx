'use client';

import React from 'react';
import { FileText, Clock, User, Sparkles } from 'lucide-react';

const AdminNotesTimeline = ({ order }) => {
    if (!order) return null;

    // Collect notes from adminNotesHistory and ensure latest order.adminNotes is included
    const historyList = Array.isArray(order.adminNotesHistory) ? [...order.adminNotesHistory] : [];
    
    if (order.adminNotes && typeof order.adminNotes === 'string' && order.adminNotes.trim()) {
        const trimmed = order.adminNotes.trim();
        const exists = historyList.some(item => (item?.note || '').trim() === trimmed);
        if (!exists) {
            historyList.push({
                note: trimmed,
                addedByName: 'Admin',
                createdAt: order.updatedAt || order.createdAt || new Date()
            });
        }
    }

    if (historyList.length === 0) return null;

    // Latest note first
    const reversedNotes = [...historyList].reverse();
    const totalCount = historyList.length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-pink-100">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center mr-3 shadow-sm">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                            Admin Notes
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Internal timeline & history notes
                        </p>
                    </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-pink-50 text-pink-600 border border-pink-200 rounded-full shadow-sm">
                    {totalCount} {totalCount === 1 ? 'Note' : 'Notes'}
                </span>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-1 sm:pl-3">
                <div className="space-y-6 sm:space-y-8">
                    {reversedNotes.map((item, idx) => {
                        const noteDate = item.createdAt ? new Date(item.createdAt) : new Date();
                        const dateFormatted = noteDate.toLocaleDateString('en-GB', {
                            timeZone: 'Asia/Dhaka',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                        const timeFormatted = noteDate.toLocaleTimeString('en-GB', {
                            timeZone: 'Asia/Dhaka',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        });
                        const isLatest = idx === 0;
                        const isLast = idx === reversedNotes.length - 1;
                        const serialNum = totalCount - idx;

                        return (
                            <div key={idx} className="relative flex items-start gap-3 sm:gap-6 group">
                                {/* Left Column: Date & Time in BDT */}
                                <div className="w-24 sm:w-28 flex-shrink-0 text-left sm:text-right pt-0.5">
                                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                                        {dateFormatted}
                                    </div>
                                    <div className="text-[11px] sm:text-xs font-semibold text-pink-600 flex items-center sm:justify-end gap-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-pink-500 flex-shrink-0" />
                                        <span>{timeFormatted}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        BDT
                                    </div>
                                </div>

                                {/* Center Column: Vertical Line & Pink Circular Dot */}
                                <div className="relative flex flex-col items-center flex-shrink-0 self-stretch">
                                    {/* Continuous connecting line */}
                                    {!isLast && (
                                        <div className="absolute top-4 bottom-[-24px] sm:bottom-[-32px] w-0.5 bg-pink-300"></div>
                                    )}
                                    {/* Circular Pink Dot */}
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 transition-transform duration-200 group-hover:scale-110 z-10 ${
                                            isLatest
                                                ? 'bg-pink-600 border-white ring-4 ring-pink-200 shadow-sm'
                                                : 'bg-pink-500 border-white ring-2 ring-pink-100'
                                        }`}
                                    />
                                </div>

                                {/* Right Column: Note Content */}
                                <div className="flex-1 min-w-0 pb-1">
                                    <div
                                        className={`p-4 rounded-xl border transition-all ${
                                            isLatest
                                                ? 'bg-gradient-to-br from-pink-50/90 via-pink-50/50 to-white border-pink-200 shadow-sm'
                                                : 'bg-slate-50/90 hover:bg-pink-50/40 border-slate-200/90'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-pink-100/70">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-pink-600 text-white shadow-xs">
                                                    #{serialNum}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    {item.addedByName || item.addedBy?.name || 'Admin'}
                                                </span>
                                            </div>

                                            {isLatest && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full border border-pink-200">
                                                    <Sparkles className="w-2.5 h-2.5 text-pink-600" />
                                                    Latest
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-slate-800 text-sm font-medium whitespace-pre-wrap leading-relaxed">
                                            {item.note}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AdminNotesTimeline;

