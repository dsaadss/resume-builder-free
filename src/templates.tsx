import React from 'react';
import { ResumeData } from './types';

// Helper for bullet points that auto-aligns based on language
const BulletList = ({ items }: { items: { id: string, name: string }[] }) => (
  <ul className="space-y-2 text-sm list-none p-0 m-0">
    {items.map(item => (
      <li key={item.id} dir="auto" className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-current opacity-80 shrink-0" aria-hidden="true"></span>
        <span className="leading-tight">{item.name}</span>
      </li>
    ))}
  </ul>
);

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

export const ClassicTemplate = ({ data }: { data: ResumeData }) => {
  return (
    <div className="flex w-full min-h-[297mm] bg-white text-gray-900" dir="rtl">
      {/* Sidebar (First in DOM = Right side in RTL) */}
      <div className="w-1/3 text-white p-8" style={{ backgroundColor: data.themeColor }}>
        {/* Profile Image */}
        {data.personal.profileImage && (
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
              <img src={data.personal.profileImage} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Personal Details */}
        <div className="mb-8">
          <h3 className="text-lg font-bold border-b border-white/30 pb-1 mb-4 text-right">פרטים אישיים</h3>
          <div className="space-y-3 text-sm text-right" dir="ltr">
            {data.personal.phone && (
              <div className="flex items-center justify-end gap-2">
                <a href={`tel:${data.personal.phone}`} className="hover:underline">{data.personal.phone}</a>
                <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]" aria-hidden="true">📞</span>
              </div>
            )}
            {data.personal.email && (
              <div className="flex items-center justify-end gap-2">
                <a href={`mailto:${data.personal.email}`} className="hover:underline">{data.personal.email}</a>
                <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]" aria-hidden="true">✉</span>
              </div>
            )}
            {data.personal.address && (
              <div className="flex items-center justify-end gap-2" dir="rtl">
                <span>{data.personal.address}</span>
                <span className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px]" aria-hidden="true">📍</span>
              </div>
            )}
            {data.personal.idNumber && (
              <div className="mt-4 text-right" dir="rtl">
                <div className="text-white/70 text-xs">תעודת זהות</div>
                <div>{data.personal.idNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        {data.links.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold border-b border-white/30 pb-1 mb-4 text-right">קישורים</h3>
            <div className="space-y-2 text-sm text-right" dir="ltr">
              {data.links.map(link => (
                <div key={link.id}>
                  <a href={link.url} className="underline hover:text-white/80">{link.name}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold border-b border-white/30 pb-1 mb-4 text-right">מיומנויות</h3>
            <BulletList items={data.skills} />
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold border-b border-white/30 pb-1 mb-4 text-right">שפות</h3>
            <BulletList items={data.languages} />
          </div>
        )}
      </div>

      {/* Main Content (Second in DOM = Left side in RTL) */}
      <div className="w-2/3 p-8">
        <h1 className="text-4xl font-bold mb-1" style={{ color: data.themeColor }}>{data.personal.firstName} {data.personal.lastName}</h1>
        <h2 className="text-xl text-gray-600 mb-6">{data.personal.title}</h2>
        
        <p className="text-sm text-gray-800 leading-relaxed mb-8 whitespace-pre-wrap">
          {data.summary}
        </p>

        {/* Experience */}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>ניסיון תעסוקתי</h3>
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
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>השכלה</h3>
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
        )}

        {/* Courses */}
        {data.courses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>קורסים</h3>
            <div className="space-y-1">
              {data.courses.map(course => (
                <div key={course.id} className="flex justify-between text-sm font-bold">
                  <span>{course.name}</span>
                  {course.grade && <span>{course.grade}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Military */}
        {data.military.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>שירות צבאי</h3>
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
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>פרוייקטים</h3>
            {data.projects.map(proj => (
              <div key={proj.id} className="mb-3">
                <div className="font-bold text-sm">{proj.name}</div>
                <FormattedDescription text={proj.description} className="text-sm text-gray-700 leading-relaxed" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ModernTemplate = ({ data }: { data: ResumeData }) => {
  return (
    <div className="w-full min-h-[297mm] bg-white text-gray-900 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="text-white p-8 flex items-center gap-8" style={{ backgroundColor: data.themeColor }}>
        {data.personal.profileImage && (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-lg shrink-0">
            <img src={data.personal.profileImage} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{data.personal.firstName} {data.personal.lastName}</h1>
          <h2 className="text-xl text-white/80 mb-4">{data.personal.title}</h2>
          <address className="flex flex-wrap gap-4 text-sm text-white/90 not-italic">
            {data.personal.phone && <span><span aria-hidden="true">📞</span> <a href={`tel:${data.personal.phone}`} className="hover:underline">{data.personal.phone}</a></span>}
            {data.personal.email && <span><span aria-hidden="true">✉</span> <a href={`mailto:${data.personal.email}`} className="hover:underline">{data.personal.email}</a></span>}
            {data.personal.address && <span><span aria-hidden="true">📍</span> {data.personal.address}</span>}
          </address>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 p-8 gap-8">
        {/* Main Content */}
        <div className="w-2/3">
          <p className="text-sm text-gray-800 leading-relaxed mb-8 whitespace-pre-wrap">
            {data.summary}
          </p>

          {/* Experience */}
          {data.experience.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>ניסיון תעסוקתי</h3>
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
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>השכלה</h3>
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
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold border-b pb-1 mb-3" style={{ color: data.themeColor, borderColor: data.themeColor }}>פרוייקטים</h3>
              {data.projects.map(proj => (
                <div key={proj.id} className="mb-3">
                  <div className="font-bold text-sm">{proj.name}</div>
                  <FormattedDescription text={proj.description} className="text-sm text-gray-700 leading-relaxed" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-1/3 space-y-8">
          {/* Skills */}
          {data.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-bold border-b pb-1 mb-4" style={{ color: data.themeColor, borderColor: data.themeColor }}>מיומנויות</h3>
              <div className="text-gray-700">
                <BulletList items={data.skills} />
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages.length > 0 && (
            <div>
              <h3 className="text-lg font-bold border-b pb-1 mb-4" style={{ color: data.themeColor, borderColor: data.themeColor }}>שפות</h3>
              <div className="text-gray-700">
                <BulletList items={data.languages} />
              </div>
            </div>
          )}

          {/* Courses */}
          {data.courses.length > 0 && (
            <div>
              <h3 className="text-lg font-bold border-b pb-1 mb-4" style={{ color: data.themeColor, borderColor: data.themeColor }}>קורסים</h3>
              <div className="space-y-2 text-sm text-gray-700">
                {data.courses.map(course => (
                  <div key={course.id} className="flex justify-between font-bold">
                    <span>{course.name}</span>
                    {course.grade && <span>{course.grade}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {data.links.length > 0 && (
            <div>
              <h3 className="text-lg font-bold border-b pb-1 mb-4" style={{ color: data.themeColor, borderColor: data.themeColor }}>קישורים</h3>
              <div className="space-y-2 text-sm text-gray-700" dir="ltr">
                {data.links.map(link => (
                  <div key={link.id} className="text-right">
                    <a href={link.url} className="underline hover:text-blue-600">{link.name}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MinimalistTemplate = ({ data }: { data: ResumeData }) => {
  return (
    <div className="w-full min-h-[297mm] bg-white text-gray-900 p-12" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: data.themeColor }}>
        <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{ color: data.themeColor }}>{data.personal.firstName} {data.personal.lastName}</h1>
        <h2 className="text-xl text-gray-600 mb-4">{data.personal.title}</h2>
        <address className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 not-italic">
          {data.personal.phone && <span><a href={`tel:${data.personal.phone}`} className="hover:underline">{data.personal.phone}</a></span>}
          {data.personal.email && <span><a href={`mailto:${data.personal.email}`} className="hover:underline">{data.personal.email}</a></span>}
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

      <p className="text-sm text-gray-800 leading-relaxed mb-8 whitespace-pre-wrap text-center max-w-3xl mx-auto">
        {data.summary}
      </p>

      <div className="grid grid-cols-1 gap-8">
        {/* Experience */}
        {data.experience.length > 0 && (
          <section>
            <h3 className="text-lg font-bold border-b pb-1 mb-4 uppercase tracking-wider" style={{ color: data.themeColor, borderColor: data.themeColor }}>ניסיון תעסוקתי</h3>
            <div className="space-y-5">
              {data.experience.map(exp => (
                <article key={exp.id}>
                  <header className="flex justify-between font-bold text-sm mb-1">
                    <h4 className="m-0 text-gray-900">{exp.role}{exp.company ? ` | ${exp.company}` : ''}</h4>
                    <span className="text-gray-500">{exp.dates}</span>
                  </header>
                  <FormattedDescription text={exp.description} className="text-sm text-gray-700 leading-relaxed" />
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section>
            <h3 className="text-lg font-bold border-b pb-1 mb-4 uppercase tracking-wider" style={{ color: data.themeColor, borderColor: data.themeColor }}>השכלה</h3>
            <div className="space-y-4">
              {data.education.map(edu => (
                <article key={edu.id}>
                  <header className="flex justify-between font-bold text-sm">
                    <h4 className="m-0 text-gray-900">{edu.degree}, {edu.institution}</h4>
                    <span className="text-gray-500">{edu.dates}</span>
                  </header>
                  {edu.gpa && <div className="text-sm text-gray-700 mt-1">GPA {edu.gpa}</div>}
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-8">
          {/* Skills */}
          {data.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-bold border-b pb-1 mb-4 uppercase tracking-wider" style={{ color: data.themeColor, borderColor: data.themeColor }}>מיומנויות</h3>
              <div className="text-gray-700">
                <BulletList items={data.skills} />
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages.length > 0 && (
            <div>
              <h3 className="text-lg font-bold border-b pb-1 mb-4 uppercase tracking-wider" style={{ color: data.themeColor, borderColor: data.themeColor }}>שפות</h3>
              <div className="text-gray-700">
                <BulletList items={data.languages} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
