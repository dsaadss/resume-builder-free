import { useRef, useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Upload, Printer, Plus, Trash2, GripVertical, Check, Languages, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
import { ResumeData, initialResumeData, emptyResumeData } from './types';
import { ClassicTemplate, ModernTemplate, MinimalistTemplate } from './templates';
import { getFakeDataProfiles } from './fakeData';
import SkyToggle from './components/ui/sky-toggle';
import TranslateButton from './components/ui/TranslateButton';

const loadSavedData = (): ResumeData => {
  if (typeof window === 'undefined') return initialResumeData;
  const saved = localStorage.getItem('resumeData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...initialResumeData,
        ...parsed,
        settings: { ...initialResumeData.settings, ...(parsed.settings || {}) },
        personal: { ...initialResumeData.personal, ...(parsed.personal || {}) },
      };
    } catch(e) {
      return initialResumeData;
    }
  }
  return initialResumeData;
};

const DraggableImagePreview = ({ img, onChange }: { img: ProfileImageInfo, onChange: (newImg: ProfileImageInfo) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    const scaleFactor = (img.scale && img.scale > 0 ? img.scale / 100 : 1);
    const ratio = 100 / (128 * scaleFactor);
    
    // Smoothly update positions without strictly jumping back if over-dragged, bounded by 0-100 like the range inputs
    const newX = Math.round(Math.min(100, Math.max(0, img.posX + deltaX * ratio)));
    const newY = Math.round(Math.min(100, Math.max(0, img.posY + deltaY * ratio)));
    
    onChange({ ...img, posX: newX, posY: newY });
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  return (
    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-400 shadow-md bg-white relative cursor-move mx-auto mb-4 touch-none"
         onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <img src={img.dataUrl} className="w-full h-full object-cover select-none pointer-events-none" 
           style={{ transform: `translate(${(img.posX - 50)}%, ${(img.posY - 50)}%) scale(${img.scale && img.scale > 0 ? (img.scale / 100) : 1}) rotate(${img.rotate || 0}deg)` }} 
           alt="Interactive Preview" />
      <div className="absolute inset-x-0 bottom-0 bg-black/40 text-black/90 pb-2 pt-1 font-bold pointer-events-none">
        <div className="text-center text-white text-[10px]">גרור לתזוזה</div>
      </div>
    </div>
  );
};

const FormSectionHeader = ({ 
  title, 
  orderKey, 
  sectionId, 
  size = 'xl', 
  register, 
  watch, 
  setValue, 
  moveOrder, 
  children 
}: { 
  title: string, 
  orderKey: 'mainOrder' | 'sidebarOrder', 
  sectionId: string, 
  size?: 'lg' | 'xl', 
  register: any,
  watch: any,
  setValue: any,
  moveOrder: (key: any, id: string, dir: number) => void,
  children?: React.ReactNode 
}) => {
  const currentPadding = watch(`settings.sectionPadding.${sectionId}`) ?? 8;
  
  return (
    <div className="flex flex-col gap-2 mb-6 border-b border-gray-100 dark:border-slate-800 pb-4 group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 w-full">
          <input 
            {...register(`settings.headlines.${sectionId}`)}
            placeholder={title}
            className={`text-${size} font-black text-slate-700 dark:text-slate-100 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none hover:bg-gray-100 dark:hover:bg-slate-900 transition p-1 -m-1 min-w-[120px] max-w-[200px]`}
          />
          {moveOrder && (
            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-md overflow-hidden border border-gray-200 dark:border-slate-700 transition-opacity" dir="ltr">
              <button type="button" onClick={() => moveOrder(orderKey, sectionId, -1)} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition text-xs font-black" title="הזז למעלה ב-PDF">↑</button>
              <div className="w-px bg-gray-300 dark:bg-slate-600"></div>
              <button type="button" onClick={() => moveOrder(orderKey, sectionId, 1)} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition text-xs font-black" title="הזז למטה ב-PDF">↓</button>
            </div>
          )}
        </div>
        {children}
      </div>
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 shadow-sm">
        <div className="flex justify-between items-center mb-2 font-sans">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ריווח עליון (סימטריה)</span>
            <span className={`text-[9px] font-bold ${currentPadding === 4 ? 'text-green-600' : currentPadding >= 3 && currentPadding <= 19 ? 'text-blue-500' : 'text-amber-500'}`}>
              {currentPadding === 4 ? '• מושלם! (הכי מומלץ)' : currentPadding >= 3 && currentPadding <= 19 ? '• טווח מומלץ (3-19px) - שים לב: 4px הכי מומלץ' : '• ריווח חריג (מומלץ סביב 4px)'}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-mono font-black text-blue-600 dark:text-blue-400">{currentPadding}</span>
            <span className="text-[9px] font-bold text-slate-400">px</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">צפוף</span>
          <input 
            type="range" min="0" max="48" 
            value={currentPadding}
            onChange={(e) => setValue(`settings.sectionPadding.${sectionId}`, parseInt(e.target.value))}
            className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" 
          />
          <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">מרווח</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [confirmAction, setConfirmAction] = useState<'clear' | 'reset' | 'translate' | null>(null);
  const [fakeIndex, setFakeIndex] = useState(0);
  const [formWidth, setFormWidth] = useState(50);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  
  const [storedHe, setStoredHe] = useState<ResumeData | null>(null);
  const [storedEn, setStoredEn] = useState<ResumeData | null>(null);
  const [isEnValidated, setIsEnValidated] = useState(false);
  const [includeHe, setIncludeHe] = useState(true);
  const [includeEn, setIncludeEn] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (darkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode]);

  // Load persistence states on mount
  useEffect(() => {
    const sHe = localStorage.getItem('storedHe');
    const sEn = localStorage.getItem('storedEn');
    const isValid = localStorage.getItem('isEnValidated');
    if (sHe) setStoredHe(JSON.parse(sHe));
    if (sEn) setStoredEn(JSON.parse(sEn));
    if (isValid) setIsEnValidated(JSON.parse(isValid));
  }, []);

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<ResumeData>({
    defaultValues: loadSavedData(),
  });
  
  const resumeData = watch();
  const printRef = useRef<HTMLDivElement>(null);

  const getTranslatedData = async (data: ResumeData, targetLang: 'he' | 'en'): Promise<ResumeData> => {
    const sourceLang = targetLang === 'en' ? 'he' : 'en';
    
    const translateDeep = async (obj: any): Promise<any> => {
      if (typeof obj === 'string') {
        const val = obj.trim();
        if (val.length < 2 || /^[0-9a-f-]{36}$/.test(val) || /^http/.test(val) || val.includes('@')) return obj;
        try {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(val)}&langpair=${sourceLang}|${targetLang}`);
          const json = await res.json();
          if (json.responseData?.translatedText) {
            return json.responseData.translatedText
              .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          }
          return obj;
        } catch (e) { return obj; }
      } else if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => translateDeep(item)));
      } else if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
          if (['id', 'dataUrl', 'posX', 'posY', 'scale', 'rotate', 'padding', 'sectionPadding', 'sidebarOrder', 'mainOrder', 'template', 'themeColor', 'appendixImages'].includes(key)) {
            newObj[key] = obj[key];
          } else {
            newObj[key] = await translateDeep(obj[key]);
          }
        }
        return newObj;
      }
      return obj;
    };

    const translated = await translateDeep(data);
    translated.language = targetLang;
    return translated;
  };

  const handleTranslateAll = async () => {
    setIsTranslatingAll(true);
    const currentLang = resumeData.language || 'he';
    const targetLang = currentLang === 'en' ? 'he' : 'en';

    // 1. Save current state to the active slot
    if (currentLang === 'he') setStoredHe(resumeData);
    else setStoredEn(resumeData);

    // 2. Load the other slot if it exists
    const otherData = targetLang === 'en' ? storedEn : storedHe;
    if (otherData) {
      reset(otherData);
      setIsTranslatingAll(false);
      setConfirmAction(null);
      return;
    }

    // 3. If target slot is empty, perform translation
    const translated = await getTranslatedData(resumeData, targetLang);
    reset(translated);
    if (targetLang === 'en') {
      setStoredEn(translated);
      setIsEnValidated(false);
    } else {
      setStoredHe(translated);
    }
    
    setIsTranslatingAll(false);
    setConfirmAction(null);
  };


  useEffect(() => {
    document.title = `Resume_${resumeData.personal.firstName}_${resumeData.personal.lastName}`;
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
    if (storedHe) localStorage.setItem('storedHe', JSON.stringify(storedHe));
    if (storedEn) localStorage.setItem('storedEn', JSON.stringify(storedEn));
    localStorage.setItem('isEnValidated', JSON.stringify(isEnValidated));
  }, [resumeData, storedHe, storedEn, isEnValidated]);

  const moveOrder = (key: 'mainOrder' | 'sidebarOrder', id: string, dir: number) => {
    const list = [...(resumeData.settings[key] || [])];
    const idx = list.indexOf(id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    setValue(`settings.${key}` as any, list);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      const images: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL('image/png'));
      }
      
      reset({ ...watch(), appendixImages: [...(watch('appendixImages') || []), ...images] });
    } catch (err) {
      console.error("Error parsing PDF", err);
      alert('שגיאה בטעינת קובץ PDF');
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col md:flex-row print:block print:bg-white selection:bg-blue-500/30 font-sans transition-colors duration-300" dir="rtl">
      {/* Form Section (Right) */}
      <div 
        className="w-full shrink-0 p-6 overflow-y-auto h-screen bg-white dark:bg-slate-950 shadow-2xl z-10 no-print border-l border-slate-200 dark:border-slate-900 transition-colors duration-300"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${formWidth}%` : '100%' }}
      >
        <div className="sticky top-0 z-[60] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 rounded-b-3xl sm:rounded-b-[2.5rem] -mx-6 -mt-6 border-b border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform"></div>
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white shrink-0 tracking-tight">בונה קורות חיים</h1>
              <button 
                type="button"
                onClick={() => document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex sm:hidden items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
              >
                <Printer size={14} />
                צפה בתצוגה
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">טען פרופילים</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(i => (
                    <button 
                      key={i}
                      type="button" 
                      onClick={() => reset(getFakeDataProfiles()[i-1])}
                      className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-500 dark:text-slate-300 hover:border-blue-500 hover:text-white hover:bg-blue-600 transition-all shadow-sm active:scale-95"
                      title={`טען פרופיל דוגמא ${i}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tooltip" title="שנה מצב תצוגה">ערכת נושא</span>
                <SkyToggle checked={darkMode} onChange={setDarkMode} />
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
              <button 
                type="button"
                onClick={() => setConfirmAction('translate')}
                disabled={isTranslatingAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm border ${
                  resumeData.language === 'en' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {isTranslatingAll ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Languages size={12} />
                )}
                {resumeData.language === 'en' ? 'Hebrew' : 'English'}
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative z-10 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mr-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={includeHe} onChange={e => setIncludeHe(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">עברית</span>
              </label>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none relative group/enToggle">
                <input 
                  type="checkbox" 
                  checked={includeEn} 
                  disabled={!storedEn}
                  onChange={e => setIncludeEn(e.target.checked)} 
                  className={`w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 ${!storedEn ? 'opacity-30' : ''}`} 
                />
                <span className={`text-[10px] font-black ${!storedEn ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 dark:text-slate-400'}`}>
                  אנגלית {storedEn && !isEnValidated && <span className="text-amber-500 font-bold">*</span>}
                </span>
                {!storedEn && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/enToggle:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    תרגם קודם לאנגלית
                  </div>
                )}
              </label>
            </div>
            
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmAction('clear')} className="flex-1 sm:flex-none bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-all text-xs font-bold shadow-sm active:scale-95">
                נקה
              </button>
              <button onClick={() => {
                if (includeEn && !isEnValidated) {
                  if (!confirm('התרגום לאנגלית טרם אושר. להמשיך בהורדה?')) return;
                }
                window.print();
              }} className="flex-x sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-bold">
                <Printer size={18} />
                <span className="whitespace-nowrap text-sm">הורד PDF</span>
              </button>
            </div>
          </div>
        </div>

        <form className="space-y-8">
          {resumeData.language === 'en' && !isEnValidated && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/40 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Languages size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-800 dark:text-amber-200">זהו תרגום אוטומטי</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">אנא ודאו שהכל תקין לפני ההורדה.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEnValidated(true)}
                className="w-full sm:w-auto bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-amber-600/20 hover:bg-amber-500 transition-all active:scale-95"
              >
                אישור תרגום
              </button>
            </div>
          )}
          {/* Template Selection */}
          <section>
            <h2 className="text-xl font-black mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">תבנית</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'classic', name: 'קלאסי (סרגל צד)' },
                { id: 'modern', name: 'מודרני (עליונה)' },
                { id: 'minimalist', name: 'מינימליסטי' }
              ].map(tpl => (
                <label key={tpl.id} className="cursor-pointer">
                  <input type="radio" value={tpl.id} {...register('template')} className="hidden" />
                  <div className={`border-2 rounded-xl p-4 text-center transition-all ${resumeData.template === tpl.id ? 'border-blue-600 bg-blue-600/5 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black shadow-[0_0_15px_rgba(37,99,235,0.1)]' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                    {tpl.name}
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Theme Color */}
          <section>
            <h2 className="text-xl font-black mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">עיצוב</h2>
            <div className="flex gap-4">
              {['#001f3f', '#2c3e50', '#0f766e', '#6b21a8', '#be123c', '#2563eb'].map(color => (
                <label key={color} className="cursor-pointer">
                  <input type="radio" value={color} {...register('themeColor')} className="hidden" />
                  <div 
                    className={`w-10 h-10 rounded-full border-2 transition-all ${resumeData.themeColor === color ? 'border-white dark:border-white ring-4 ring-blue-600/20 dark:ring-blue-600/30 scale-110 shadow-lg' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-105 shadow-sm'}`}
                    style={{ backgroundColor: color }}
                  ></div>
                </label>
              ))}
            </div>
          </section>

          {/* Advanced Layout Settings */}
          <section>
            <h2 className="text-xl font-black mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">הגדרות מתקדמות</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 -translate-x-12"></div>
                <label className="flex flex-col gap-1 mb-4 relative z-10">
                  <div className="flex justify-between items-center text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span>ריווח שוליים כללי (Padding)</span>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-black">{resumeData.settings.padding}</span>
                      <span className="text-[9px] font-bold text-slate-400">px</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold mt-1 transition-colors ${resumeData.settings.padding === 4 ? 'text-green-600 dark:text-green-400' : resumeData.settings.padding >= 3 && resumeData.settings.padding <= 19 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-500'}`}>
                    {resumeData.settings.padding === 4 ? '• מושלם! (הכי מומלץ)' : resumeData.settings.padding >= 3 && resumeData.settings.padding <= 19 ? '• טווח מומלץ לתוצאה נקייה (3-19px) - הערה: 4px הכי מומלץ' : '• שימו לב: ריווח חריג (מומלץ סביב 4px)'}
                  </span>
                </label>
                <div className="flex items-center gap-4 relative z-10">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap">צפוף</span>
                  <input 
                    type="range" min="0" max="32" 
                    value={resumeData.settings.padding} 
                    onChange={(e) => setValue('settings.padding', parseInt(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" 
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap">מרווח</span>
                </div>
              </div>
            </div>
          </section>

          {/* Personal Details */}
          <section>
            <FormSectionHeader 
              title="פרטים אישיים" 
              orderKey="sidebarOrder" 
              sectionId="personal"
              register={register} 
              watch={watch} 
              setValue={setValue} 
              moveOrder={undefined as any}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 mb-2 p-5 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.03] dark:bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 relative z-10">גלריית תלושי/תמונות פרופיל</label>
                
                <div className="flex flex-wrap gap-4 mb-4 relative z-10">
                  {resumeData.personal.profileImages?.map(img => (
                    <div 
                      key={img.id} 
                      className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all group ${resumeData.personal.activeProfileImageId === img.id ? 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] scale-110' : 'border-slate-100 dark:border-slate-800 hover:border-blue-400'}`}
                    >
                      <img src={img.dataUrl} alt="Profile" className="w-full h-full object-cover" style={{ transform: `translate(${(img.posX - 50)}%, ${(img.posY - 50)}%) scale(${img.scale && img.scale > 0 ? (img.scale / 100) : 1}) rotate(${img.rotate || 0}deg)` }} />
                      <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition z-10">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newImages = resumeData.personal.profileImages.filter(i => i.id !== img.id);
                            const newActiveId = newImages.length > 0 ? newImages[0].id : undefined;
                            reset({ ...watch(), personal: { ...watch('personal'), profileImages: newImages, activeProfileImageId: newActiveId } });
                          }} 
                          className="text-red-400 hover:text-red-300 transition-colors transform hover:scale-110" title="מחק"
                        >
                          <Trash2 size={22} />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            reset({ ...watch(), personal: { ...watch('personal'), activeProfileImageId: img.id } });
                          }} 
                          className="text-green-400 hover:text-green-300 transition-colors transform hover:scale-110" title="בחר"
                        >
                          <Check size={26} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <label className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition shadow-sm active:scale-95" title="הוסף תמונה חדשה">
                    <Plus size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const newId = uuidv4();
                          const newImg = { id: newId, dataUrl: reader.result as string, posX: 50, posY: 50 };
                          const currentImages = resumeData.personal.profileImages || [];
                          reset({ ...watch(), personal: { ...watch('personal'), profileImages: [...currentImages, newImg], activeProfileImageId: newId } });
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }} />
                  </label>
                </div>
                
                {resumeData.personal.activeProfileImageId && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md mt-4 relative overflow-hidden group/adj">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/[0.03] dark:bg-blue-500/5 rounded-full -translate-y-12 -translate-x-12"></div>
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 text-center relative z-10">התאמת תמונה - גרור או השתמש במחוונים</h4>
                    
                    <DraggableImagePreview 
                      img={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)!}
                      onChange={(newImg) => {
                        const newImages = resumeData.personal.profileImages.map(img => 
                          img.id === resumeData.personal.activeProfileImageId ? newImg : img
                        );
                        // Use setValue for much smoother updates during dragging
                        setValue('personal.profileImages', newImages);
                      }}
                    />

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">אופקי (X)</span>
                        <input 
                          type="range" min="0" max="100" 
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.posX || 50}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, posX: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="flex-1 cursor-ew-resize accent-blue-600 h-2 bg-blue-100 rounded-full appearance-none hover:bg-blue-200 transition-colors" 
                        />
                        <input 
                          type="number" min="0" max="100"
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.posX || 50}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, posX: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="w-12 text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded p-1 text-center font-mono focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">אנכי (Y)</span>
                        <input 
                          type="range" min="0" max="100" 
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.posY || 50}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, posY: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="flex-1 cursor-ew-resize accent-blue-600 h-2 bg-blue-100 rounded-full appearance-none hover:bg-blue-200 transition-colors" 
                        />
                        <input 
                          type="number" min="0" max="100"
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.posY || 50}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, posY: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="w-12 text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded p-1 text-center font-mono focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">סיבוב</span>
                        <input 
                          type="range" min="-180" max="180" 
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.rotate || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, rotate: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="flex-1 cursor-ew-resize accent-blue-600 h-2 bg-blue-100 rounded-full appearance-none hover:bg-blue-200 transition-colors" 
                        />
                        <input 
                          type="number" min="-180" max="180"
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.rotate || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, rotate: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="w-12 text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded p-1 text-center font-mono focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">זום</span>
                        <input 
                          type="range" min="10" max="400" 
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.scale || 100}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, scale: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="flex-1 cursor-ew-resize accent-blue-600 h-2 bg-blue-100 rounded-full appearance-none hover:bg-blue-200 transition-colors" 
                        />
                        <input 
                          type="number" min="10" max="400"
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.scale || 100}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 100;
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, scale: val } : img
                            );
                            setValue('personal.profileImages', newImages);
                          }}
                          className="w-12 text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded p-1 text-center font-mono focus:border-blue-500 focus:outline-none shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  <span>שם פרטי</span>
                  <TranslateButton value={watch('personal.firstName')} onTranslate={(val) => setValue('personal.firstName', val)} />
                </label>
                <input {...register('personal.firstName')} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  <span>שם משפחה</span>
                  <TranslateButton value={watch('personal.lastName')} onTranslate={(val) => setValue('personal.lastName', val)} />
                </label>
                <input {...register('personal.lastName')} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  <span>הגדרת תפקיד</span>
                  <TranslateButton value={watch('personal.title')} onTranslate={(val) => setValue('personal.title', val)} />
                </label>
                <input {...register('personal.title')} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  <span>אימייל</span>
                </label>
                <input {...register('personal.email')} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" dir="ltr" />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  <span>טלפון נייד</span>
                </label>
                <input {...register('personal.phone')} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" dir="ltr" />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  <span>כתובת</span>
                  <TranslateButton value={watch('personal.address')} onTranslate={(val) => setValue('personal.address', val)} />
                </label>
                <input {...register('personal.address')} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                  <span>תעודת זהות</span>
                </label>
                <input {...register('personal.idNumber')} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" dir="ltr" />
              </div>
            </div>
          </section>

          {/* Summary */}
          <section>
            <FormSectionHeader 
              title="תקציר" 
              orderKey="mainOrder" 
              sectionId="summary" 
              register={register} 
              watch={watch} 
              setValue={setValue} 
              moveOrder={moveOrder} 
            >
              <TranslateButton value={watch('summary')} onTranslate={(val) => setValue('summary', val)} />
            </FormSectionHeader>
            <textarea {...register('summary')} rows={4} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all shadow-sm" placeholder="תיאור קצר המפרט את הניסיון המקצועי שלך..."></textarea>
          </section>

          {/* Experience */}
          <section>
            <FormSectionHeader 
              title="ניסיון תעסוקתי" 
              orderKey="mainOrder" 
              sectionId="experience"
              register={register} 
              watch={watch} 
              setValue={setValue} 
              moveOrder={moveOrder}
            >
              <button type="button" onClick={() => {
                const current = watch('experience');
                reset({ ...watch(), experience: [...current, { id: uuidv4(), role: '', company: '', dates: '', description: '' }] });
              }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm font-bold transition-colors">
                <Plus size={16} /> הוסף ניסיון
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.experience.map((exp, index) => (
                <div key={exp.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative group transition-all hover:border-slate-200 dark:hover:border-slate-700 shadow-sm relative overflow-hidden group/item">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/[0.03] dark:bg-blue-500/5 rounded-full -translate-y-10 -translate-x-10"></div>
                  <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover/item:opacity-100 transition z-10">
                    <button type="button" onClick={() => {
                      if (index === 0) return;
                      const current = watch('experience');
                      const newArr = [...current];
                      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
                      reset({ ...watch(), experience: newArr });
                    }} className="text-gray-500 hover:text-blue-600 disabled:opacity-30" disabled={index === 0}>
                      <span className="text-xs">▲</span>
                    </button>
                    <button type="button" onClick={() => {
                      const current = watch('experience');
                      if (index === current.length - 1) return;
                      const newArr = [...current];
                      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
                      reset({ ...watch(), experience: newArr });
                    }} className="text-gray-500 hover:text-blue-600 disabled:opacity-30" disabled={index === watch('experience').length - 1}>
                      <span className="text-xs">▼</span>
                    </button>
                    <button type="button" onClick={() => {
                      const current = watch('experience');
                      reset({ ...watch(), experience: current.filter((_, i) => i !== index) });
                    }} className="text-red-500 hover:text-red-700 ml-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                        <span>תפקיד</span>
                        <TranslateButton value={watch(`experience.${index}.role`)} onTranslate={(val) => setValue(`experience.${index}.role`, val)} />
                      </label>
                      <input {...register(`experience.${index}.role`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                        <span>חברה/ארגון</span>
                        <TranslateButton value={watch(`experience.${index}.company`)} onTranslate={(val) => setValue(`experience.${index}.company`, val)} />
                      </label>
                      <input {...register(`experience.${index}.company`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">שנים</label>
                      <input {...register(`experience.${index}.dates`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                      <span>תיאור</span>
                      <TranslateButton value={watch(`experience.${index}.description`)} onTranslate={(val) => setValue(`experience.${index}.description`, val)} />
                    </label>
                    <textarea {...register(`experience.${index}.description`)} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <FormSectionHeader 
              title="השכלה" 
              orderKey="mainOrder" 
              sectionId="education"
              register={register} 
              watch={watch} 
              setValue={setValue} 
              moveOrder={moveOrder}
            >
              <button type="button" onClick={() => {
                const current = watch('education');
                reset({ ...watch(), education: [...current, { id: uuidv4(), degree: '', institution: '', dates: '', gpa: '' }] });
              }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm font-bold transition-colors">
                <Plus size={16} /> הוסף השכלה
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.education.map((edu, index) => (
                <div key={edu.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative group/item transition-all hover:border-slate-200 dark:hover:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/[0.03] dark:bg-blue-500/5 rounded-full -translate-y-10 -translate-x-10"></div>
                  <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover/item:opacity-100 transition z-10">
                    <button type="button" onClick={() => {
                      if (index === 0) return;
                      const current = watch('education');
                      const newArr = [...current];
                      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
                      reset({ ...watch(), education: newArr });
                    }} className="text-gray-500 hover:text-blue-600 disabled:opacity-30" disabled={index === 0}>
                      <span className="text-xs">▲</span>
                    </button>
                    <button type="button" onClick={() => {
                      const current = watch('education');
                      if (index === current.length - 1) return;
                      const newArr = [...current];
                      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
                      reset({ ...watch(), education: newArr });
                    }} className="text-gray-500 hover:text-blue-600 disabled:opacity-30" disabled={index === watch('education').length - 1}>
                      <span className="text-xs">▼</span>
                    </button>
                    <button type="button" onClick={() => {
                      const current = watch('education');
                      reset({ ...watch(), education: current.filter((_, i) => i !== index) });
                    }} className="text-red-500 hover:text-red-700 ml-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                        <span>תואר/תעודה</span>
                        <TranslateButton value={watch(`education.${index}.degree`)} onTranslate={(val) => setValue(`education.${index}.degree`, val)} />
                      </label>
                      <input {...register(`education.${index}.degree`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                        <span>מוסד לימודים</span>
                        <TranslateButton value={watch(`education.${index}.institution`)} onTranslate={(val) => setValue(`education.${index}.institution`, val)} />
                      </label>
                      <input {...register(`education.${index}.institution`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">שנים</label>
                      <input {...register(`education.${index}.dates`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                        <span>ממוצע/הערות</span>
                        <TranslateButton value={watch(`education.${index}.gpa`)} onTranslate={(val) => setValue(`education.${index}.gpa`, val)} />
                      </label>
                      <input {...register(`education.${index}.gpa`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Courses */}
          <section>
            <FormSectionHeader 
              title="קורסים" 
              orderKey="mainOrder" 
              sectionId="courses"
              register={register} 
              watch={watch} 
              setValue={setValue} 
              moveOrder={moveOrder}
            >
              <button type="button" onClick={() => {
                const current = watch('courses');
                reset({ ...watch(), courses: [...current, { id: uuidv4(), name: '', grade: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף קורס
              </button>
            </FormSectionHeader>
            <div className="space-y-3">
              {resumeData.courses.map((course, index) => (
                <div key={course.id} className="flex gap-2 items-center">
                  <input {...register(`courses.${index}.name`)} placeholder="שם הקורס" className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                  <input {...register(`courses.${index}.grade`)} placeholder="ציון" className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                  <button type="button" onClick={() => {
                    const current = watch('courses');
                    reset({ ...watch(), courses: current.filter((_, i) => i !== index) });
                  }} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-2 transform hover:scale-110 transition-all"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Military */}
          <section>
            <FormSectionHeader 
              title="שירות צבאי" 
              orderKey="mainOrder" 
              sectionId="military"
              register={register} 
              watch={watch} 
              setValue={setValue} 
              moveOrder={moveOrder}
            >
              <button type="button" onClick={() => {
                const current = watch('military');
                reset({ ...watch(), military: [...current, { id: uuidv4(), role: '', dates: '', description: '' }] });
              }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm font-bold transition-colors">
                <Plus size={16} /> הוסף שירות צבאי
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.military.map((mil, index) => (
                <div key={mil.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative group/item transition-all hover:border-slate-200 dark:hover:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/[0.03] dark:bg-blue-500/5 rounded-full -translate-y-10 -translate-x-10"></div>
                  <button type="button" onClick={() => {
                    const current = watch('military');
                    reset({ ...watch(), military: current.filter((_, i) => i !== index) });
                  }} className="absolute top-2 left-2 text-red-500 opacity-0 group-hover/item:opacity-100 transition z-10">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                        <span>תפקיד</span>
                        <TranslateButton value={watch(`military.${index}.role`)} onTranslate={(val) => setValue(`military.${index}.role`, val)} />
                      </label>
                      <input {...register(`military.${index}.role`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">שנים</label>
                      <input {...register(`military.${index}.dates`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                      <span>תיאור</span>
                      <TranslateButton value={watch(`military.${index}.description`)} onTranslate={(val) => setValue(`military.${index}.description`, val)} />
                    </label>
                    <textarea {...register(`military.${index}.description`)} rows={2} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section>
            <FormSectionHeader 
              title="פרוייקטים" 
              orderKey="mainOrder" 
              sectionId="projects"
              register={register} 
              watch={watch} 
              setValue={setValue} 
              moveOrder={moveOrder}
            >
              <button type="button" onClick={() => {
                const current = watch('projects');
                reset({ ...watch(), projects: [...current, { id: uuidv4(), name: '', description: '' }] });
              }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm font-bold transition-colors">
                <Plus size={16} /> הוסף פרוייקט
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.projects.map((proj, index) => (
                <div key={proj.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative group/item transition-all hover:border-slate-200 dark:hover:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/[0.03] dark:bg-blue-500/5 rounded-full -translate-y-10 -translate-x-10"></div>
                  <button type="button" onClick={() => {
                    const current = watch('projects');
                    reset({ ...watch(), projects: current.filter((_, i) => i !== index) });
                  }} className="absolute top-2 left-2 text-red-500 opacity-0 group-hover/item:opacity-100 transition z-10">
                    <Trash2 size={18} />
                  </button>
                  <div className="mb-4 relative z-10">
                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                      <span>שם הפרוייקט</span>
                      <TranslateButton value={watch(`projects.${index}.name`)} onTranslate={(val) => setValue(`projects.${index}.name`, val)} />
                    </label>
                    <input {...register(`projects.${index}.name`)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                  </div>
                  <div className="relative z-10">
                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest px-1">
                      <span>תיאור</span>
                      <TranslateButton value={watch(`projects.${index}.description`)} onTranslate={(val) => setValue(`projects.${index}.description`, val)} />
                    </label>
                    <textarea {...register(`projects.${index}.description`)} rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Skills, Languages, Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills */}
            <section>
              <FormSectionHeader 
                title="מיומנויות" 
                orderKey="sidebarOrder" 
                sectionId="skills" 
                size="lg"
                register={register} 
                watch={watch} 
                setValue={setValue} 
                moveOrder={moveOrder}
              >
                <button type="button" onClick={() => {
                  const current = watch('skills');
                  reset({ ...watch(), skills: [...current, { id: uuidv4(), name: '' }] });
                }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm font-bold transition-colors">
                  <Plus size={16} /> הוסף
                </button>
              </FormSectionHeader>
              <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 px-1">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  <input type="radio" value="bullets" {...register('settings.skillsFormat')} className="accent-blue-600 w-4 h-4" /> רשימה
                </label>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  <input type="radio" value="comma-separated" {...register('settings.skillsFormat')} className="accent-blue-600 w-4 h-4" /> פסקה (פסיקים)
                </label>
              </div>
              <div className="space-y-3">
                {resumeData.skills.map((skill, index) => (
                  <div key={skill.id} className="flex gap-2 items-center relative group/field">
                    <input {...register(`skills.${index}.name`)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm pl-12" dir="ltr" />
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-opacity">
                      <TranslateButton value={watch(`skills.${index}.name`)} onTranslate={(val) => setValue(`skills.${index}.name`, val)} className="!border-none !bg-transparent !shadow-none" />
                    </div>
                    <button type="button" onClick={() => {
                      const current = watch('skills');
                      reset({ ...watch(), skills: current.filter((_, i) => i !== index) });
                    }} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-2 transform hover:scale-110 transition-all"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </section>

            {/* Languages */}
            <section>
              <FormSectionHeader 
                title="שפות" 
                orderKey="sidebarOrder" 
                sectionId="languages" 
                size="lg"
                register={register} 
                watch={watch} 
                setValue={setValue} 
                moveOrder={moveOrder}
              >
                <button type="button" onClick={() => {
                  const current = watch('languages');
                  reset({ ...watch(), languages: [...current, { id: uuidv4(), name: '' }] });
                }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm font-bold transition-colors">
                  <Plus size={16} /> הוסף
                </button>
              </FormSectionHeader>
              <div className="space-y-3">
                {resumeData.languages.map((lang, index) => (
                  <div key={lang.id} className="flex gap-2 items-center relative group/field">
                    <input {...register(`languages.${index}.name`)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm pl-12" dir="ltr" />
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-opacity">
                      <TranslateButton value={watch(`languages.${index}.name`)} onTranslate={(val) => setValue(`languages.${index}.name`, val)} className="!border-none !bg-transparent !shadow-none" />
                    </div>
                    <button type="button" onClick={() => {
                      const current = watch('languages');
                      reset({ ...watch(), languages: current.filter((_, i) => i !== index) });
                    }} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-2 transform hover:scale-110 transition-all"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="col-span-1 md:col-span-2">
              <FormSectionHeader 
                title="קישורים" 
                orderKey="sidebarOrder" 
                sectionId="links" 
                size="lg"
                register={register} 
                watch={watch} 
                setValue={setValue} 
                moveOrder={moveOrder}
              >
                <button type="button" onClick={() => {
                  const current = watch('links');
                  reset({ ...watch(), links: [...current, { id: uuidv4(), name: '', url: '' }] });
                }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm font-bold transition-colors">
                  <Plus size={16} /> הוסף קישור
                </button>
              </FormSectionHeader>
              <div className="space-y-3">
                {resumeData.links.map((link, index) => (
                  <div key={link.id} className="flex gap-2 items-center">
                    <input {...register(`links.${index}.name`)} placeholder="LinkedIn" className="w-1/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" dir="ltr" />
                    <input {...register(`links.${index}.url`)} placeholder="URL" className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" dir="ltr" />
                    <button type="button" onClick={() => {
                      const current = watch('links');
                      reset({ ...watch(), links: current.filter((_, i) => i !== index) });
                    }} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-2 transform hover:scale-110 transition-all"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </section>

            {/* Appendix */}
            <section className="col-span-1 md:col-span-2">
              <FormSectionHeader 
                title="הוסף דפי PDF" 
                orderKey="sidebarOrder" 
                sectionId="appendix"
                register={register} 
                watch={watch} 
                setValue={setValue} 
                moveOrder={undefined as any}
              />
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest -mt-4 mb-4">כגון: גיליון ציונים, דיפלומה, מכתבי המלצה</p>
              <div className="space-y-4">
                <label className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-[0.98] group/upload shadow-sm">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 group-hover/upload:scale-110 transition-transform">
                    <Upload size={24} className="text-slate-400 group-hover/upload:text-blue-600 dark:group-hover/upload:text-blue-400 transition-colors" />
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-slate-700 dark:text-slate-300">העלה קבצי PDF</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">קבצי PDF בלבד</span>
                  </div>
                  <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                </label>
                {resumeData.appendixImages && resumeData.appendixImages.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400">נטענו {resumeData.appendixImages.length} עמודים.</p>
                    <button type="button" onClick={() => reset({ ...watch(), appendixImages: [] })} className="text-xs font-black text-red-500 hover:text-red-700 transition-colors">מחק הכל</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </form>
      </div>

      {/* Resizable Splitter */}
      <div 
        className="hidden md:flex flex-col items-center justify-center shrink-0 w-1.5 cursor-col-resize bg-slate-200 dark:bg-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 active:bg-blue-700 transition-all group z-20"
        onMouseDown={(e) => {
          e.preventDefault();
          const moveListener = (moveEvent: MouseEvent) => {
            const windowWidth = window.innerWidth;
            const newPercentage = ((windowWidth - moveEvent.clientX) / windowWidth) * 100;
            if (newPercentage > 20 && newPercentage < 80) setFormWidth(newPercentage);
          };
          const upListener = () => {
            document.removeEventListener('mousemove', moveListener);
            document.removeEventListener('mouseup', upListener);
            document.body.style.userSelect = '';
          };
          document.body.style.userSelect = 'none';
          document.addEventListener('mousemove', moveListener);
          document.addEventListener('mouseup', upListener);
        }}
      >
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <div className="w-1 h-1 rounded-full bg-white shadow-sm"></div>
          <div className="w-1 h-1 rounded-full bg-white shadow-sm"></div>
          <div className="w-1 h-1 rounded-full bg-white shadow-sm"></div>
        </div>
      </div>

      {/* Preview Section (Left) */}
      <div 
        id="preview-section"
        className="bg-slate-100 dark:bg-slate-900 p-4 md:p-12 overflow-y-auto h-screen flex justify-center items-start print:p-0 print:m-0 print:w-full print:h-auto print:block print:bg-white print:overflow-visible shrink-0 shadow-inner"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${100 - formWidth}%` : '100%' }}
      >
        <div className="transform scale-[0.6] sm:scale-[0.8] md:scale-[0.6] lg:scale-[0.8] xl:scale-100 origin-top print:transform-none print:scale-100 print:w-full print:h-auto print:m-0 print:p-0">
          <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] print:shadow-none print:m-0 print:p-0" ref={printRef}>
            {includeHe && (
              <>
                {(storedHe || (resumeData.language === 'he' ? resumeData : null)) && (
                  <>
                    {(storedHe || resumeData).template === 'classic' && <ClassicTemplate data={storedHe || resumeData} />}
                    {(storedHe || resumeData).template === 'modern' && <ModernTemplate data={storedHe || resumeData} />}
                    {(storedHe || resumeData).template === 'minimalist' && <MinimalistTemplate data={storedHe || resumeData} />}
                  </>
                )}
              </>
            )}
            
            {includeEn && storedEn && (
              <div className="break-before-page mt-8 print:mt-0">
                {storedEn.template === 'classic' && <ClassicTemplate data={storedEn} />}
                {storedEn.template === 'modern' && <ModernTemplate data={storedEn} />}
                {storedEn.template === 'minimalist' && <MinimalistTemplate data={storedEn} />}
              </div>
            )}
            
            {resumeData.appendixImages?.map((img, i) => (
              <div key={`appendix-${i}`} className="print:block print:w-[210mm] print:h-[297mm] print:m-0 print:p-0 break-before-page w-[210mm] min-h-[297mm] flex flex-col items-center justify-center bg-white mt-4 print:mt-0 shadow-2xl print:shadow-none">
                <img src={img} alt={`Appendix Page ${i+1}`} className="max-w-[210mm] max-h-[297mm] object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] no-print p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 relative overflow-hidden" dir="rtl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.03] dark:bg-red-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            
            <h3 className="text-2xl font-black mb-3 text-slate-800 dark:text-white relative z-10">
              {confirmAction === 'clear' ? 'נקה נתונים?' : confirmAction === 'translate' ? 'תרגם את כל הקורות חיים?' : 'חזור לנתוני דוגמה?'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed font-medium relative z-10">
              {confirmAction === 'clear' 
                ? 'הפעולה תמחק את כל הטופס ותתחיל מסמך ריק. כל מה שהזנת יימחק לצמיתות.'
                : confirmAction === 'translate'
                ? 'הפעולה תתרגם את כל השדות בקורות החיים ותהפוך את כיוון הדף. מומלץ לגבות נתונים חשובים.'
                : 'הפעולה תשחזר את קורות החיים המקוריים של ירדן ותמחוק את השינויים שלך.'}
            </p>
            <div className="flex gap-4 relative z-10">
              <button 
                type="button" 
                onClick={() => setConfirmAction(null)} 
                className="flex-1 px-6 py-3.5 text-sm font-black text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-200 dark:border-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ביטול
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (confirmAction === 'clear') reset(emptyResumeData);
                  if (confirmAction === 'reset') reset(initialResumeData);
                  if (confirmAction === 'translate') handleTranslateAll();
                  if (confirmAction !== 'translate') setConfirmAction(null);
                }} 
                className={`flex-1 px-6 py-3.5 text-sm font-black text-white rounded-2xl transition-all shadow-lg active:scale-95 ${
                  confirmAction === 'translate' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                {confirmAction === 'translate' ? 'תרגם הכל' : 'כן, בצע'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
