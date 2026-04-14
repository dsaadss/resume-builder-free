import React from 'react';
import { ResumeData } from './types';

// Helper for bullet points that auto-aligns based on language
const BulletList = ({ items, format }: { items: { id: string, name: string }[], format?: string }) => {
  if (format === 'comma-separated') {
    return <div className="text-sm leading-relaxed" dir="auto">{items.map(i => i.name).join(', ')}</div>;
  }
  return (
    <ul className="space-y-2 text-sm list-none p-0 m-0">
      {items.map(item => (
        <li key={item.id} dir="auto" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-current opacity-80 shrink-0" aria-hidden="true"></span>
          <span className="leading-tight">{item.name}</span>
        </li>
      ))}
    </ul>
  );
};

const FormattedDescription = ({ text, className }: { text: string, className?: string }) => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length > 1) {
    return (
      <ul className={`list-disc list-inside mt-1 space-y-1 marker:text-gray-400 ${className || ''}`}>
        {lines.map((line, i) => (
          <li key={i}>{line.replace(/^[-*•]\s*/, '')}</li>
        ))}
      </ul>
    );
  }
  return <div className={`mt-1 whitespace-pre-wrap ${className || ''}`}>{text.replace(/^[-*•]\s*/, '')}</div>;
};

const getPad = (data: ResumeData, key: string) => {
  // Check section specific padding first, fallback to global padding, fallback to 8
  const padVal = data.settings?.sectionPadding?.[key];
  const finalVal = padVal !== undefined ? padVal : (data.settings?.padding ?? 8);
  return `${finalVal * 4}px`;
};

// --- Block Generators ---
// These ensure we can map over mainOrder / sidebarOrder with all their unique styles.

const generateMainBlocks = (data: ResumeData, templateClassTheme: string) => {
  const h = data.settings?.headlines || {};
  return {
    summary: data.summary ? (
      <div style={{ paddingBottom: getPad(data, 'summary') }}>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
      </div>
    ) : null,
    experience: data.experience.length > 0 ? (
      <section style={{ paddingBottom: getPad(data, 'experience') }}>
        <h3 className={templateClassTheme} style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.experience || 'ניסיון תעסוקתי'}</h3>
        {data.experience.map(exp => (
          <article key={exp.id} className="mb-4">
            <header className="flex justify-between font-bold text-sm">
              <h4 className="m-0 text-gray-900">{exp.role}{exp.company ? `, ${exp.company}` : ''}</h4>
              <span className="text-gray-500 whitespace-nowrap mr-4">{exp.dates}</span>
            </header>
            <FormattedDescription text={exp.description} className="text-sm text-gray-700 leading-relaxed" />
          </article>
        ))}
      </section>
    ) : null,
    education: data.education.length > 0 ? (
      <section style={{ paddingBottom: getPad(data, 'education') }}>
        <h3 className={templateClassTheme} style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.education || 'השכלה'}</h3>
        {data.education.map(edu => (
          <article key={edu.id} className="mb-3">
            <header className="flex justify-between font-bold text-sm">
              <h4 className="m-0 text-gray-900">{edu.degree}, {edu.institution}</h4>
              <span className="text-gray-500 whitespace-nowrap mr-4">{edu.dates}</span>
            </header>
            {edu.gpa && <div className="text-sm text-gray-700">GPA {edu.gpa}</div>}
          </article>
        ))}
      </section>
    ) : null,
    courses: data.courses.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'courses') }}>
        <h3 className={templateClassTheme} style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.courses || 'קורסים'}</h3>
        <div className="space-y-1 text-sm">
          {data.courses.map(course => (
            <div key={course.id} className="flex justify-between font-bold">
              <span>{course.name}</span>
              {course.grade && <span>{course.grade}</span>}
            </div>
          ))}
        </div>
      </div>
    ) : null,
    military: data.military.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'military') }}>
        <h3 className={templateClassTheme} style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.military || 'שירות צבאי'}</h3>
        {data.military.map(mil => (
          <div key={mil.id} className="mb-3">
            <div className="flex justify-between font-bold text-sm">
              <span>{mil.role}</span>
              <span className="text-gray-500 whitespace-nowrap mr-4">{mil.dates}</span>
            </div>
            <FormattedDescription text={mil.description} className="text-sm text-gray-700" />
          </div>
        ))}
      </div>
    ) : null,
    projects: data.projects.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'projects') }}>
        <h3 className={templateClassTheme} style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.projects || 'פרוייקטים'}</h3>
        {data.projects.map(proj => (
          <div key={proj.id} className="mb-3">
            <div className="font-bold text-sm">{proj.name}</div>
            <FormattedDescription text={proj.description} className="text-sm text-gray-700 leading-relaxed" />
          </div>
        ))}
      </div>
    ) : null
  } as Record<string, React.ReactNode>;
};


export const ClassicTemplate = ({ data }: { data: ResumeData }) => {
  const activeImg = data.personal.profileImages?.find(i => i.id === data.personal.activeProfileImageId);
  const globalPadStr = `${(data.settings?.padding ?? 8) * 4}px`;
  const h = data.settings?.headlines || {};
  
  const sidebarBlocks: Record<string, React.ReactNode> = {
    personal: (
      <div style={{ paddingBottom: getPad(data, 'personal') }}>
        <h3 className={`text-lg font-bold border-b border-white/30 pb-1 mb-4 ${data.language === 'en' ? 'text-left' : 'text-right'}`}>{h.personal || (data.language === 'en' ? 'Personal Details' : 'פרטים אישיים')}</h3>
        <div className={`space-y-3 text-sm ${data.language === 'en' ? 'text-left' : 'text-right'}`} dir="ltr">
          {data.personal.phone && (
            <div className={`flex items-center gap-2 ${data.language === 'en' ? 'justify-start' : 'justify-end'}`}>
              <a href={`tel:${data.personal.phone}`} className="hover:underline">{data.personal.phone}</a>
              <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]" aria-hidden="true">📞</span>
            </div>
          )}
          {data.personal.email && (
            <div className={`flex items-center gap-2 ${data.language === 'en' ? 'justify-start' : 'justify-end'}`}>
              <a href={`mailto:${data.personal.email}`} className="hover:underline">{data.personal.email}</a>
              <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]" aria-hidden="true">✉</span>
            </div>
          )}
          {data.personal.address && (
            <div className={`flex items-center gap-2 ${data.language === 'en' ? 'justify-start' : 'justify-end'}`} dir="auto">
              <span>{data.personal.address}</span>
              <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]" aria-hidden="true">📍</span>
            </div>
          )}
          {data.personal.idNumber && (
            <div className={`mt-4 ${data.language === 'en' ? 'text-left' : 'text-right'}`} dir="auto">
              <div className="text-white/70 text-xs">{data.language === 'en' ? 'ID Number' : 'תעודת זהות'}</div>
              <div>{data.personal.idNumber}</div>
            </div>
          )}
        </div>
      </div>
    ),
    links: data.links.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'links') }}>
        <h3 className={`text-lg font-bold border-b border-white/30 pb-1 mb-4 ${data.language === 'en' ? 'text-left' : 'text-right'}`}>{h.links || (data.language === 'en' ? 'Links' : 'קישורים')}</h3>
        <div className={`space-y-2 text-sm ${data.language === 'en' ? 'text-left' : 'text-right'}`} dir="ltr">
          {data.links.map(link => (
            <div key={link.id}><a href={link.url} className="underline hover:text-white/80">{link.name}</a></div>
          ))}
        </div>
      </div>
    ) : null,
    skills: data.skills.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'skills') }}>
        <h3 className={`text-lg font-bold border-b border-white/30 pb-1 mb-4 ${data.language === 'en' ? 'text-left' : 'text-right'}`}>{h.skills || (data.language === 'en' ? 'Skills' : 'מיומנויות')}</h3>
        <BulletList items={data.skills} format={data.settings?.skillsFormat} />
      </div>
    ) : null,
    languages: data.languages.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'languages') }}>
        <h3 className={`text-lg font-bold border-b border-white/30 pb-1 mb-4 ${data.language === 'en' ? 'text-left' : 'text-right'}`}>{h.languages || (data.language === 'en' ? 'Languages' : 'שפות')}</h3>
        <BulletList items={data.languages} />
      </div>
    ) : null
  };

  const mainBlocks = generateMainBlocks(data, "text-lg font-bold border-b pb-1 mb-3");

  return (
    <div className="flex w-full min-h-[297mm] bg-white text-gray-900" dir={data.language === 'en' ? 'ltr' : 'rtl'}>
      {/* Sidebar */}
      <div className="w-1/3 text-white" style={{ backgroundColor: data.themeColor, padding: globalPadStr }}>
        {activeImg && (
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-lg shrink-0">
              <img src={activeImg.dataUrl} alt="Profile" className="w-full h-full object-cover" style={{ transform: `translate(${(activeImg.posX - 50)}%, ${(activeImg.posY - 50)}%) scale(${activeImg.scale && activeImg.scale > 0 ? activeImg.scale / 100 : 1}) rotate(${activeImg.rotate || 0}deg)` }} />
            </div>
          </div>
        )}
        {data.settings?.sidebarOrder?.map(key => <React.Fragment key={key}>{sidebarBlocks[key]}</React.Fragment>)}
      </div>

      {/* Main */}
      <div className="w-2/3" style={{ padding: globalPadStr }}>
        <h1 className="text-4xl font-bold mb-1" style={{ color: data.themeColor }}>{data.personal.firstName} {data.personal.lastName}</h1>
        <h2 className="text-xl text-gray-600 mb-6">{data.personal.title}</h2>
        {data.settings?.mainOrder?.map(key => <React.Fragment key={key}>{mainBlocks[key]}</React.Fragment>)}
      </div>
    </div>
  );
};


export const ModernTemplate = ({ data }: { data: ResumeData }) => {
  const activeImg = data.personal.profileImages?.find(i => i.id === data.personal.activeProfileImageId);
  const globalPadStr = `${(data.settings?.padding ?? 8) * 4}px`;
  const h = data.settings?.headlines || {};

  const sidebarBlocks: Record<string, React.ReactNode> = {
    skills: data.skills.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'skills') }}>
        <h3 className="text-lg font-bold border-b pb-1 mb-4" style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.skills || 'מיומנויות'}</h3>
        <div className="text-gray-700"><BulletList items={data.skills} format={data.settings?.skillsFormat} /></div>
      </div>
    ) : null,
    languages: data.languages.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'languages') }}>
        <h3 className="text-lg font-bold border-b pb-1 mb-4" style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.languages || 'שפות'}</h3>
        <div className="text-gray-700"><BulletList items={data.languages} /></div>
      </div>
    ) : null,
    links: data.links.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'links') }}>
        <h3 className="text-lg font-bold border-b pb-1 mb-4" style={{ color: data.themeColor, borderColor: data.themeColor }}>{h.links || 'קישורים'}</h3>
        <div className="space-y-2 text-sm text-gray-700" dir="ltr">
          {data.links.map(link => (
            <div key={link.id} className="text-right">
              <a href={link.url} className="underline hover:text-blue-600">{link.name}</a>
            </div>
          ))}
        </div>
      </div>
    ) : null
  };

  const mainBlocks = generateMainBlocks(data, "text-lg font-bold border-b pb-1 mb-3");

  return (
    <div className="w-full min-h-[297mm] bg-white text-gray-900 flex flex-col" dir={data.language === 'en' ? 'ltr' : 'rtl'}>
      {/* Header */}
      <div className="text-white flex items-center gap-8" style={{ backgroundColor: data.themeColor, padding: globalPadStr }}>
        {activeImg && (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-lg shrink-0">
            <img src={activeImg.dataUrl} alt="Profile" className="w-full h-full object-cover" style={{ transform: `translate(${(activeImg.posX - 50)}%, ${(activeImg.posY - 50)}%) scale(${activeImg.scale && activeImg.scale > 0 ? activeImg.scale / 100 : 1}) rotate(${activeImg.rotate || 0}deg)` }} />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{data.personal.firstName} {data.personal.lastName}</h1>
          <h2 className="text-xl text-white/80 mb-4">{data.personal.title}</h2>
          <address className="flex flex-wrap gap-4 text-sm text-white/90 not-italic">
            {data.personal.phone && <span><span aria-hidden="true">📞</span> {data.personal.phone}</span>}
            {data.personal.email && <span><span aria-hidden="true">✉</span> {data.personal.email}</span>}
            {data.personal.address && <span><span aria-hidden="true">📍</span> {data.personal.address}</span>}
          </address>
        </div>
      </div>

      <div className="flex flex-1 gap-8" style={{ padding: globalPadStr }}>
        {/* Main Content */}
        <div className="w-2/3">
          {data.settings?.mainOrder?.map(key => <React.Fragment key={key}>{mainBlocks[key]}</React.Fragment>)}
        </div>
        {/* Sidebar */}
        <div className="w-1/3">
          {data.settings?.sidebarOrder?.map(key => <React.Fragment key={key}>{sidebarBlocks[key]}</React.Fragment>)}
        </div>
      </div>
    </div>
  );
};


export const MinimalistTemplate = ({ data }: { data: ResumeData }) => {
  const pad = (data.settings?.padding ?? 8) * 4;
  const padStr = `${pad * 1.5}px ${pad}px`; // Minimalist has slightly larger Y padding natively
  const h = data.settings?.headlines || {};

  const mainBlocks = generateMainBlocks(data, "text-lg font-bold border-b pb-1 mb-4 uppercase tracking-wider text-gray-900");

  const sidebarBlocks: Record<string, React.ReactNode> = {
    skills: data.skills.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'skills') }}>
        <h3 className="text-lg font-bold border-b pb-1 mb-4 uppercase tracking-wider text-gray-900" style={{ borderColor: data.themeColor }}>{h.skills || 'מיומנויות'}</h3>
        <div className="text-gray-700"><BulletList items={data.skills} format={data.settings?.skillsFormat} /></div>
      </div>
    ) : null,
    languages: data.languages.length > 0 ? (
      <div style={{ paddingBottom: getPad(data, 'languages') }}>
        <h3 className="text-lg font-bold border-b pb-1 mb-4 uppercase tracking-wider text-gray-900" style={{ borderColor: data.themeColor }}>{h.languages || 'שפות'}</h3>
        <div className="text-gray-700"><BulletList items={data.languages} /></div>
      </div>
    ) : null,
    links: null // Minimalist puts links in header natively
  };

  return (
    <div className="w-full min-h-[297mm] bg-white text-gray-900" style={{ padding: padStr }} dir={data.language === 'en' ? 'ltr' : 'rtl'}>
      {/* Header */}
      <div className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: data.themeColor }}>
        <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{ color: data.themeColor }}>{data.personal.firstName} {data.personal.lastName}</h1>
        <h2 className="text-xl text-gray-600 mb-4">{data.personal.title}</h2>
        <address className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 not-italic">
          {data.personal.phone && <span>{data.personal.phone}</span>}
          {data.personal.email && <span>{data.personal.email}</span>}
          {data.personal.address && <span>{data.personal.address}</span>}
        </address>
        {data.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 text-sm mt-2" dir="ltr">
            {data.links.map(link => (
              <a key={link.id} href={link.url} className="underline text-gray-600 hover:text-gray-900">{link.name}</a>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1">
        {data.settings?.mainOrder?.map(key => <React.Fragment key={key}>{mainBlocks[key]}</React.Fragment>)}

        <div className="grid grid-cols-2 gap-8">
          {data.settings?.sidebarOrder?.map(key => <React.Fragment key={key}>{sidebarBlocks[key]}</React.Fragment>)}
        </div>
      </div>
    </div>
  );
};
