import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';

interface TranslateButtonProps {
  value: string | undefined;
  onTranslate: (translated: string) => void;
  className?: string;
}

const TranslateButton: React.FC<TranslateButtonProps> = ({ value, onTranslate, className }) => {
  const [loading, setLoading] = useState(false);

  // Don't show if the value is too short to translate meaningfully
  if (!value || value.trim().length < 2) return null;

  const isHebrew = /[\u0590-\u05FF]/.test(value);
  const targetLang = isHebrew ? 'en' : 'he';
  const sourceLang = isHebrew ? 'he' : 'en';

  const handleTranslate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // MyMemory API - Free tier
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.responseData?.translatedText) {
        // Unescape HTML entities that MyMemory sometimes returns (like &#39;)
        const decodedText = data.responseData.translatedText
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
          
        onTranslate(decodedText);
      } else {
        console.warn("Translation API returned no content:", data);
      }
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTranslate();
      }}
      disabled={loading}
      className={`inline-flex items-center gap-1 py-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-sm border ${
        loading 
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-500/10'
      } ${className}`}
      title={isHebrew ? 'Translate to English' : 'תרגם לעברית'}
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}
      <span className="opacity-80">{loading ? '...' : isHebrew ? 'EN' : 'HE'}</span>
    </button>
  );
};

export default TranslateButton;
