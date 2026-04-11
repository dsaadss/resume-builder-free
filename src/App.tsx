import { useRef, useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Upload, Printer, Plus, Trash2, GripVertical } from 'lucide-react';
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
      return JSON.parse(saved) as ResumeData;
    } catch(e) {
      return initialResumeData;
    }
  }
  return initialResumeData;
};

export default function App() {
  const [confirmAction, setConfirmAction] = useState<'clear' | 'reset' | null>(null);
  const { register, control, handleSubmit, reset, watch } = useForm<ResumeData>({
    defaultValues: loadSavedData(),
  });
  
  const resumeData = watch();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Resume_${resumeData.personal.firstName}_${resumeData.personal.lastName}`;
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
  }, [resumeData]);

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
      <div className="w-full md:w-1/2 p-6 overflow-y-auto h-screen bg-white shadow-lg z-10 no-print">
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

          {/* Personal Details */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">פרטים אישיים</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 mb-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">תמונת פרופיל</label>
                <div className="flex items-center gap-4">
                  {resumeData.personal.profileImage ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                      <img src={resumeData.personal.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => reset({ ...watch(), personal: { ...watch('personal'), profileImage: '' } })} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      <Upload size={20} />
                    </div>
                  )}
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 transition">
                    בחר תמונה
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          reset({ ...watch(), personal: { ...watch('personal'), profileImage: reader.result as string } });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
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
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">תקציר</h2>
            <textarea {...register('summary')} rows={4} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="תיאור קצר המפרט את הניסיון המקצועי שלך..."></textarea>
          </section>

          {/* Experience */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-700">ניסיון תעסוקתי</h2>
              <button type="button" onClick={() => {
                const current = watch('experience');
                reset({ ...watch(), experience: [...current, { id: uuidv4(), role: '', company: '', dates: '', description: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף ניסיון
              </button>
            </div>
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
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-700">השכלה</h2>
              <button type="button" onClick={() => {
                const current = watch('education');
                reset({ ...watch(), education: [...current, { id: uuidv4(), degree: '', institution: '', dates: '', gpa: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף השכלה
              </button>
            </div>
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
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-700">קורסים</h2>
              <button type="button" onClick={() => {
                const current = watch('courses');
                reset({ ...watch(), courses: [...current, { id: uuidv4(), name: '', grade: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף קורס
              </button>
            </div>
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
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-700">שירות צבאי</h2>
              <button type="button" onClick={() => {
                const current = watch('military');
                reset({ ...watch(), military: [...current, { id: uuidv4(), role: '', dates: '', description: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף שירות צבאי
              </button>
            </div>
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
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-semibold text-gray-700">פרוייקטים</h2>
              <button type="button" onClick={() => {
                const current = watch('projects');
                reset({ ...watch(), projects: [...current, { id: uuidv4(), name: '', description: '' }] });
              }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Plus size={16} /> הוסף פרוייקט
              </button>
            </div>
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
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold text-gray-700">מיומנויות</h2>
                <button type="button" onClick={() => {
                  const current = watch('skills');
                  reset({ ...watch(), skills: [...current, { id: uuidv4(), name: '' }] });
                }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                  <Plus size={16} /> הוסף
                </button>
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
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold text-gray-700">שפות</h2>
                <button type="button" onClick={() => {
                  const current = watch('languages');
                  reset({ ...watch(), languages: [...current, { id: uuidv4(), name: '' }] });
                }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                  <Plus size={16} /> הוסף
                </button>
              </div>
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
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-semibold text-gray-700">קישורים</h2>
                <button type="button" onClick={() => {
                  const current = watch('links');
                  reset({ ...watch(), links: [...current, { id: uuidv4(), name: '', url: '' }] });
                }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                  <Plus size={16} /> הוסף קישור
                </button>
              </div>
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

      {/* Preview Section (Left) */}
      <div className="w-full md:w-1/2 bg-gray-200 p-4 md:p-8 overflow-y-auto h-screen flex justify-center items-start print:p-0 print:m-0 print:w-full print:h-auto print:block print:bg-white print:overflow-visible">
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
