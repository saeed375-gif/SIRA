import React, { useEffect, useRef } from 'react';
import { SourceCitation } from '../types';
import { ShieldCheck, BookOpen, ScrollText, CheckCircle2, ExternalLink, X } from 'lucide-react';

interface SourcesModalProps {
  sources: SourceCitation[];
  placeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({
  sources,
  placeName,
  isOpen,
  onClose,
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const isDemo = sources.some(s => s.isDemo);
  useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen]);

  return (
    <dialog ref={dialog} onCancel={onClose} aria-label={`مصادر ${placeName}`} className="sira-source-dialog">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#160E36] border border-[#D4AF37]/40 shadow-2xl p-6 md:p-8 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          aria-label="إغلاق المصادر"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-[#110B29] text-[#A89CB9] hover:text-[#FAF8F5] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E5C158]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#E5C158] uppercase tracking-wider block">
              مصادر الحكاية وسياقها
            </span>
            <h3 className="text-xl font-bold text-[#FAF8F5]">
              المصادر: {placeName}
            </h3>
          </div>
        </div>

        <p className="text-xs md:text-sm text-[#D8CDE8] mb-6 leading-relaxed">
          {isDemo ? 'هذا محتوى تجريبي واضح، وليس شهادة تاريخية أو مقابلة ميدانية. راجع سياق كل مادة أدناه.' : 'المراجع المرتبطة بهذا المحتوى كما وردت في بيانات سيرة.'}
        </p>

        {/* Sources List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {sources.map((source, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#110B29] border border-[#2F2160] hover:border-[#D4AF37]/50 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#E5C158] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/30 flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5" />
                  {source.type}
                </span>
                <span className="text-xs font-num text-[#A89CB9]">
                  {source.yearOrPeriod}
                </span>
              </div>

              <h4 className="text-base font-bold text-[#FAF8F5] mb-1">
                {source.title}
              </h4>
              <p className="text-xs text-[#A89CB9] mb-2 font-medium">
                المؤلف / الموثق: {source.author}
              </p>

              {source.url && <a className="text-[#E5C158] underline text-xs" href={source.url} target="_blank" rel="noreferrer">افتح المصدر</a>}
              {source.quote && (
                <div className="p-3 rounded-lg bg-[#18103A] border-r-2 border-[#D4AF37] text-xs text-[#DDD5E8] font-serif-ar italic leading-relaxed">
                  "{source.quote}"
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Verification Guarantee */}
        <div className="mt-6 pt-4 border-t border-[#2F2160] flex items-center justify-between gap-3 text-xs text-[#A89CB9]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span>{isDemo ? 'بانتظار التوثيق قبل النشر كمحتوى حقيقي' : 'مصادر مرفقة بالمحتوى'}</span>
          </div>
          <button
            aria-label="إغلاق المصادر"
          onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#110B29] font-bold text-xs transition-all active:scale-95"
          >
            إغلاق
          </button>
        </div>
      </div>
    </dialog>
  );
};
