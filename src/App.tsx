import { useRef, useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Upload, Printer, Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
import { ResumeData, initialResumeData, emptyResumeData } from './types';
import { ClassicTemplate, ModernTemplate, MinimalistTemplate } from './templates';

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

export default function App() {
  const [confirmAction, setConfirmAction] = useState<'clear' | 'reset' | null>(null);
  const [formWidth, setFormWidth] = useState(50);
  const { register, control, handleSubmit, reset, watch } = useForm<ResumeData>({
    defaultValues: loadSavedData(),
  });
  
  const resumeData = watch();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Resume_${resumeData.personal.firstName}_${resumeData.personal.lastName}`;
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
  }, [resumeData]);

  const moveOrder = (key: 'mainOrder' | 'sidebarOrder', id: string, dir: number) => {
    const list = [...(resumeData.settings[key] || [])];
    const idx = list.indexOf(id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    reset({ ...resumeData, settings: { ...resumeData.settings, [key]: list } });
  };

  const FormSectionHeader = ({ title, orderKey, sectionId, size = 'xl', children }: { title: string, orderKey: 'mainOrder' | 'sidebarOrder', sectionId: string, size?: 'lg' | 'xl', children?: React.ReactNode }) => (
    <div className="flex flex-col gap-2 mb-4 border-b pb-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 w-full">
          <input 
            {...register(`settings.headlines.${sectionId}`)}
            placeholder={title}
            className={`text-${size} font-semibold text-gray-700 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none hover:bg-gray-50 transition p-1 -m-1 min-w-[120px] max-w-[200px]`}
          />
          <div className="flex bg-gray-100 rounded-md overflow-hidden border border-gray-200" dir="ltr">
            <button type="button" onClick={() => moveOrder(orderKey, sectionId, -1)} className="px-2 py-1 hover:bg-gray-200 text-gray-700 hover:text-black transition text-sm font-black" title="הזז למעלה ב-PDF">↑</button>
            <div className="w-px bg-gray-300"></div>
            <button type="button" onClick={() => moveOrder(orderKey, sectionId, 1)} className="px-2 py-1 hover:bg-gray-200 text-gray-700 hover:text-black transition text-sm font-black" title="הזז למטה ב-PDF">↓</button>
          </div>
        </div>
        {children}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-1.5 rounded-lg w-fit mt-1 border border-gray-100">
        <span className="font-medium text-gray-600">ריווח עליון: צפוף</span>
        <input type="range" min="0" max="16" defaultValue={8} {...register(`settings.sectionPadding.${sectionId}`, { valueAsNumber: true })} className="w-24 accent-blue-600" />
        <span className="font-medium text-gray-600">מרווח</span>
      </div>
    </div>
  );

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

        // Fill with white to prevent transparency/ghosting issues in print
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
    // Clear input so user can add the same file again if they deleted it
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row print:block print:bg-white" dir="rtl">
      {/* Form Section (Right) */}
      <div 
        className="w-full shrink-0 p-6 overflow-y-auto h-screen bg-white shadow-lg z-10 no-print"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${formWidth}%` : '100%' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 shrink-0">בונה קורות חיים</h1>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmAction('clear')} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium whitespace-nowrap">
              נקה טופס
            </button>
            <button type="button" onClick={() => setConfirmAction('reset')} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm font-medium whitespace-nowrap" title="טען את קורות החיים של ירדן (לדוגמה)">
              טען דוגמא
            </button>
            <button onClick={() => handlePrint()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
              <Printer size={20} />
              <span className="hidden sm:inline whitespace-nowrap">הורד PDF</span>
            </button>
          </div>
        </div>

        <form className="space-y-8">
          {/* Template Selection */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">תבנית</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'classic', name: 'קלאסי (סרגל צד)' },
                { id: 'modern', name: 'מודרני (כותרת עליונה)' },
                { id: 'minimalist', name: 'מינימליסטי (נקי)' }
              ].map(tpl => (
                <label key={tpl.id} className="cursor-pointer">
                  <input type="radio" value={tpl.id} {...register('template')} className="hidden" />
                  <div className={`border-2 rounded-lg p-3 text-center transition-all ${resumeData.template === tpl.id ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-gray-200 hover:border-blue-300 text-gray-600'}`}>
                    {tpl.name}
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Theme Color */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">עיצוב</h2>
            <div className="flex gap-3">
              {['#001f3f', '#2c3e50', '#0f766e', '#6b21a8', '#be123c', '#1e3a8a'].map(color => (
                <label key={color} className="cursor-pointer">
                  <input type="radio" value={color} {...register('themeColor')} className="hidden" />
                  <div 
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${resumeData.themeColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  ></div>
                </label>
              ))}
            </div>
          </section>

          {/* Advanced Layout Settings */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">הגדרות מתקדמות</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ריווח שוליים כללי (Padding)</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium">צפוף</span>
                  <input type="range" min="0" max="16" {...register('settings.padding', { valueAsNumber: true })} className="flex-1 accent-blue-600" />
                  <span className="text-xs text-gray-500 font-medium">מרווח</span>
                </div>
              </div>
            </div>
          </section>

          {/* Personal Details */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">פרטים אישיים</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 mb-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">גלריית תלושי/תמונות פרופיל</label>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  {resumeData.personal.profileImages?.map(img => (
                    <div 
                      key={img.id} 
                      className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all group ${resumeData.personal.activeProfileImageId === img.id ? 'border-blue-500 shadow-md scale-110' : 'border-transparent hover:border-blue-300'}`}
                    >
                      <img src={img.dataUrl} alt="Profile" className="w-full h-full object-cover" style={{ objectPosition: `${img.posX}% ${img.posY}%`, transform: `scale(${img.scale && img.scale > 0 ? (img.scale / 100) : 1})` }} />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition z-10">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newImages = resumeData.personal.profileImages.filter(i => i.id !== img.id);
                            const newActiveId = newImages.length > 0 ? newImages[0].id : undefined;
                            reset({ ...watch(), personal: { ...watch('personal'), profileImages: newImages, activeProfileImageId: newActiveId } });
                          }} 
                          className="text-red-400 hover:text-red-300 transition" title="מחק"
                        >
                          <Trash2 size={22} />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            reset({ ...watch(), personal: { ...watch('personal'), activeProfileImageId: img.id } });
                          }} 
                          className="text-green-400 hover:text-green-300 transition" title="בחר"
                        >
                          <Check size={26} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <label className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500 transition shadow-sm" title="הוסף תמונה חדשה">
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
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mt-2">
                    <h4 className="text-xs font-semibold text-gray-600 mb-3">הזז תמונה להתאמה מושלמת למסגרת:</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">אופקי (X)</span>
                        <input 
                          type="range" min="0" max="100" 
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.posX || 50}
                          onChange={(e) => {
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, posX: parseInt(e.target.value) } : img
                            );
                            reset({ ...watch(), personal: { ...watch('personal'), profileImages: newImages } });
                          }}
                          className="flex-1 cursor-ew-resize accent-blue-600"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">אנכי (Y)</span>
                        <input 
                          type="range" min="0" max="100" 
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.posY || 50}
                          onChange={(e) => {
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, posY: parseInt(e.target.value) } : img
                            );
                            reset({ ...watch(), personal: { ...watch('personal'), profileImages: newImages } });
                          }}
                          className="flex-1 cursor-ew-resize accent-blue-600"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">זום (Scale)</span>
                        <input 
                          type="range" min="100" max="300" 
                          value={resumeData.personal.profileImages.find(i => i.id === resumeData.personal.activeProfileImageId)?.scale || 100}
                          onChange={(e) => {
                            const newImages = resumeData.personal.profileImages.map(img => 
                              img.id === resumeData.personal.activeProfileImageId ? { ...img, scale: parseInt(e.target.value) } : img
                            );
                            reset({ ...watch(), personal: { ...watch('personal'), profileImages: newImages } });
                          }}
                          className="flex-1 cursor-ew-resize accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">שם פרטי</label>
                <input {...register('personal.firstName')} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">שם משפחה</label>
                <input {...register('personal.lastName')} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">הגדרת תפקיד</label>
                <input {...register('personal.title')} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">אימייל</label>
                <input {...register('personal.email')} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">טלפון נייד</label>
                <input {...register('personal.phone')} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">כתובת</label>
                <input {...register('personal.address')} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">תעודת זהות</label>
                <input {...register('personal.idNumber')} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" dir="ltr" />
              </div>
            </div>
          </section>

          {/* Summary */}
          <section>
            <FormSectionHeader title="תקציר" orderKey="mainOrder" sectionId="summary" />
            <textarea {...register('summary')} rows={4} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="תיאור קצר המפרט את הניסיון המקצועי שלך..."></textarea>
          </section>

          {/* Experience */}
          <section>
            <FormSectionHeader title="ניסיון תעסוקתי" orderKey="mainOrder" sectionId="experience">
              <button type="button" onClick={() => {
                const current = watch('experience');
                reset({ ...watch(), experience: [...current, { id: uuidv4(), role: '', company: '', dates: '', description: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף ניסיון
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.experience.map((exp, index) => (
                <div key={exp.id} className="bg-gray-50 p-4 rounded-lg border relative group">
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
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
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">תפקיד</label>
                      <input {...register(`experience.${index}.role`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">חברה/ארגון</label>
                      <input {...register(`experience.${index}.company`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">שנים</label>
                      <input {...register(`experience.${index}.dates`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">תיאור</label>
                    <textarea {...register(`experience.${index}.description`)} rows={3} className="w-full border rounded p-1.5 text-sm resize-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <FormSectionHeader title="השכלה" orderKey="mainOrder" sectionId="education">
              <button type="button" onClick={() => {
                const current = watch('education');
                reset({ ...watch(), education: [...current, { id: uuidv4(), degree: '', institution: '', dates: '', gpa: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף השכלה
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.education.map((edu, index) => (
                <div key={edu.id} className="bg-gray-50 p-4 rounded-lg border relative group">
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">תואר/תעודה</label>
                      <input {...register(`education.${index}.degree`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">מוסד לימודים</label>
                      <input {...register(`education.${index}.institution`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">שנים</label>
                      <input {...register(`education.${index}.dates`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">ממוצע/הערות</label>
                      <input {...register(`education.${index}.gpa`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Courses */}
          <section>
            <FormSectionHeader title="קורסים" orderKey="mainOrder" sectionId="courses">
              <button type="button" onClick={() => {
                const current = watch('courses');
                reset({ ...watch(), courses: [...current, { id: uuidv4(), name: '', grade: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף קורס
              </button>
            </FormSectionHeader>
            <div className="space-y-2">
              {resumeData.courses.map((course, index) => (
                <div key={course.id} className="flex gap-2 items-center">
                  <input {...register(`courses.${index}.name`)} placeholder="שם הקורס" className="flex-1 border rounded p-1.5 text-sm" />
                  <input {...register(`courses.${index}.grade`)} placeholder="ציון" className="w-24 border rounded p-1.5 text-sm" />
                  <button type="button" onClick={() => {
                    const current = watch('courses');
                    reset({ ...watch(), courses: current.filter((_, i) => i !== index) });
                  }} className="text-red-500 p-1"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Military */}
          <section>
            <FormSectionHeader title="שירות צבאי" orderKey="mainOrder" sectionId="military">
              <button type="button" onClick={() => {
                const current = watch('military');
                reset({ ...watch(), military: [...current, { id: uuidv4(), role: '', dates: '', description: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף שירות צבאי
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.military.map((mil, index) => (
                <div key={mil.id} className="bg-gray-50 p-4 rounded-lg border relative group">
                  <button type="button" onClick={() => {
                    const current = watch('military');
                    reset({ ...watch(), military: current.filter((_, i) => i !== index) });
                  }} className="absolute top-2 left-2 text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">תפקיד</label>
                      <input {...register(`military.${index}.role`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">שנים</label>
                      <input {...register(`military.${index}.dates`)} className="w-full border rounded p-1.5 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">תיאור</label>
                    <textarea {...register(`military.${index}.description`)} rows={2} className="w-full border rounded p-1.5 text-sm resize-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section>
            <FormSectionHeader title="פרוייקטים" orderKey="mainOrder" sectionId="projects">
              <button type="button" onClick={() => {
                const current = watch('projects');
                reset({ ...watch(), projects: [...current, { id: uuidv4(), name: '', description: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף פרוייקט
              </button>
            </FormSectionHeader>
            <div className="space-y-4">
              {resumeData.projects.map((proj, index) => (
                <div key={proj.id} className="bg-gray-50 p-4 rounded-lg border relative group">
                  <button type="button" onClick={() => {
                    const current = watch('projects');
                    reset({ ...watch(), projects: current.filter((_, i) => i !== index) });
                  }} className="absolute top-2 left-2 text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={16} />
                  </button>
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">שם הפרוייקט</label>
                    <input {...register(`projects.${index}.name`)} className="w-full border rounded p-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">תיאור</label>
                    <textarea {...register(`projects.${index}.description`)} rows={3} className="w-full border rounded p-1.5 text-sm resize-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Skills, Languages, Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills */}
            <section>
              <FormSectionHeader title="מיומנויות" orderKey="sidebarOrder" sectionId="skills" size="lg">
                <button type="button" onClick={() => {
                  const current = watch('skills');
                  reset({ ...watch(), skills: [...current, { id: uuidv4(), name: '' }] });
                }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                  <Plus size={16} /> הוסף
                </button>
              </FormSectionHeader>
              <div className="flex gap-4 mb-3 pb-2 border-b border-gray-100">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-blue-600">
                  <input type="radio" value="bullets" {...register('settings.skillsFormat')} className="accent-blue-600" /> רשימה ארוכה
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-blue-600">
                  <input type="radio" value="comma-separated" {...register('settings.skillsFormat')} className="accent-blue-600" /> פסקה חסכונית (פסיקים)
                </label>
              </div>
              <div className="space-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={skill.id} className="flex gap-2 items-center">
                    <input {...register(`skills.${index}.name`)} className="flex-1 border rounded p-1.5 text-sm" dir="ltr" />
                    <button type="button" onClick={() => {
                      const current = watch('skills');
                      reset({ ...watch(), skills: current.filter((_, i) => i !== index) });
                    }} className="text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </section>

            {/* Languages */}
            <section>
              <FormSectionHeader title="שפות" orderKey="sidebarOrder" sectionId="languages" size="lg">
                <button type="button" onClick={() => {
                  const current = watch('languages');
                  reset({ ...watch(), languages: [...current, { id: uuidv4(), name: '' }] });
                }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                  <Plus size={16} /> הוסף
                </button>
              </FormSectionHeader>
              <div className="space-y-2">
                {resumeData.languages.map((lang, index) => (
                  <div key={lang.id} className="flex gap-2 items-center">
                    <input {...register(`languages.${index}.name`)} className="flex-1 border rounded p-1.5 text-sm" dir="ltr" />
                    <button type="button" onClick={() => {
                      const current = watch('languages');
                      reset({ ...watch(), languages: current.filter((_, i) => i !== index) });
                    }} className="text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="col-span-1 md:col-span-2">
              <FormSectionHeader title="קישורים" orderKey="sidebarOrder" sectionId="links" size="lg">
                <button type="button" onClick={() => {
                  const current = watch('links');
                  reset({ ...watch(), links: [...current, { id: uuidv4(), name: '', url: '' }] });
                }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                  <Plus size={16} /> הוסף קישור
                </button>
              </FormSectionHeader>
              <div className="space-y-2">
                {resumeData.links.map((link, index) => (
                  <div key={link.id} className="flex gap-2 items-center">
                    <input {...register(`links.${index}.name`)} placeholder="שם (לדוגמה: LinkedIn)" className="w-1/3 border rounded p-1.5 text-sm" dir="ltr" />
                    <input {...register(`links.${index}.url`)} placeholder="URL" className="flex-1 border rounded p-1.5 text-sm" dir="ltr" />
                    <button type="button" onClick={() => {
                      const current = watch('links');
                      reset({ ...watch(), links: current.filter((_, i) => i !== index) });
                    }} className="text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </section>

            {/* Appendix */}
            <section className="col-span-1 md:col-span-2">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold text-gray-700">נספחים (גיליון ציונים)</h2>
              </div>
              <div className="space-y-4">
                <label className="cursor-pointer flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition text-gray-600">
                  <Upload size={24} />
                  <span>העלה גיליון ציונים (PDF)</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                </label>
                {resumeData.appendixImages && resumeData.appendixImages.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-green-600">נטענו {resumeData.appendixImages.length} עמודי נספח.</p>
                    <button type="button" onClick={() => reset({ ...watch(), appendixImages: [] })} className="text-sm text-red-500 hover:underline inline-block w-fit">מחק נספחים</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </form>
      </div>

      {/* Resizable Splitter */}
      <div 
        className="hidden md:flex flex-col items-center justify-center shrink-0 w-2 cursor-col-resize bg-gray-200 hover:bg-blue-400 active:bg-blue-600 transition group z-20"
        onMouseDown={(e) => {
          e.preventDefault();
          const moveListener = (moveEvent: MouseEvent) => {
            const windowWidth = window.innerWidth;
            // In RTL, 0 is right. The Form is attached right.
            // Form width is distance from right side: window.innerWidth - moveEvent.clientX
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
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
          <div className="w-1 h-1 rounded-full bg-white shadow-sm"></div>
          <div className="w-1 h-1 rounded-full bg-white shadow-sm"></div>
          <div className="w-1 h-1 rounded-full bg-white shadow-sm"></div>
        </div>
      </div>

      {/* Preview Section (Left) */}
      <div 
        className="bg-gray-200 p-4 md:p-8 overflow-y-auto h-screen flex justify-center items-start print:p-0 print:m-0 print:w-full print:h-auto print:block print:bg-white print:overflow-visible shrink-0"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${100 - formWidth}%` : '100%' }}
      >
        <div className="transform scale-[0.6] sm:scale-[0.8] md:scale-[0.6] lg:scale-[0.8] xl:scale-100 origin-top print:transform-none print:scale-100 print:w-full print:h-auto print:m-0 print:p-0">
          <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] print:shadow-none print:m-0 print:p-0" ref={printRef}>
            {resumeData.template === 'classic' && <ClassicTemplate data={resumeData} />}
            {resumeData.template === 'modern' && <ModernTemplate data={resumeData} />}
            {resumeData.template === 'minimalist' && <MinimalistTemplate data={resumeData} />}
            
            {resumeData.appendixImages?.map((img, i) => (
              <div key={`appendix-${i}`} className="print:block print:w-[210mm] print:h-[297mm] print:m-0 print:p-0 break-before-page w-[210mm] min-h-[297mm] flex flex-col items-center justify-center bg-white mt-4 print:mt-0 shadow-2xl print:shadow-none">
                <img src={img} alt={`Appendix Page ${i+1}`} className="max-w-[210mm] max-h-[297mm] object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] no-print">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full border border-gray-100 m-4" dir="rtl">
            <h3 className="text-xl font-bold mb-3 text-gray-800">
              {confirmAction === 'clear' ? 'נקה נתונים?' : 'חזור לנתוני דוגמה?'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {confirmAction === 'clear' 
                ? 'הפעולה תמחק את כל הטופס ותתחיל מסמך ריק. כל מה שהזנת יימחק ולא ניתן לבטל פעולה זו.'
                : 'הפעולה תשחזר את קורות החיים המקוריים של ירדן ותמחוק את מה שהזנת. לא ניתן לבטל פעולה זו.'}
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">ביטול</button>
              <button 
                type="button"
                onClick={() => {
                  if (confirmAction === 'clear') reset(emptyResumeData);
                  if (confirmAction === 'reset') reset(initialResumeData);
                  setConfirmAction(null);
                }} 
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-sm"
              >
                כן, אני בטוח
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
