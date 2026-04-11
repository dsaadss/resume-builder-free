export type ProfileImageInfo = {
  id: string;
  dataUrl: string;
  posX: number;
  posY: number;
  scale?: number;
  rotate?: number;
};

export type TemplateSettings = {
  padding: number;
  sectionPadding?: Record<string, number>;
  headlines: Record<string, string>;
  sidebarOrder: string[];
  mainOrder: string[];
  skillsFormat?: 'bullets' | 'comma-separated';
};

export type ResumeData = {
  template: string;
  themeColor: string;
  settings: TemplateSettings;
  personal: {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    address: string;
    idNumber: string;
    profileImages: ProfileImageInfo[];
    activeProfileImageId?: string;
  };
  summary: string;
  experience: Array<{ id: string; role: string; company: string; dates: string; description: string }>;
  education: Array<{ id: string; degree: string; institution: string; dates: string; gpa: string }>;
  skills: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string; grade: string }>;
  military: Array<{ id: string; role: string; dates: string; description: string }>;
  languages: Array<{ id: string; name: string }>;
  links: Array<{ id: string; name: string; url: string }>;
  projects: Array<{ id: string; name: string; description: string }>;
  appendixImages?: string[];
};

export const initialResumeData: ResumeData = {
  template: "classic",
  themeColor: "#001f3f",
  settings: {
    padding: 8,
    sectionPadding: {},
    headlines: {},
    sidebarOrder: ['personal', 'links', 'skills', 'languages'],
    mainOrder: ['summary', 'experience', 'education', 'courses', 'military', 'projects'],
    skillsFormat: 'bullets'
  },
  personal: {
    firstName: "ירדן שלום",
    lastName: "בר-אל",
    title: "Student",
    email: "warra2124@gmail.com",
    phone: "0548122053",
    address: "שביל הזורעים 71, כרמיאל, ישראל",
    idNumber: "314875113",
    profileImages: [],
  },
  summary: "סטודנט הסמסטר האחרון להנדסת תוכנה (B.Sc) ב-ORT בראודה (ממוצע 83).\nבעל רקע טכני חזק וניסיון מעשי בפיתוח Full-stack, עבודה עם מסדי נתונים (MySQL) ושפות התכנות Java, Python ו-C. בעל ידע מעמיק בתחומי Data Mining, אבטחת מידע ומערכות IoT. בעל יכולת למידה עצמית גבוהה וניסיון בפתרון בעיות בסביבות עבודה דינמיות. מחפש להשתלב בתפקיד פיתוח קבוע ומאתגר.",
  experience: [],
  education: [
    {
      id: "1",
      degree: "B.Sc בהנדסת תוכנה",
      institution: "המכללה האקדמית להנדסה בראודה",
      dates: "2021 - 2026",
      gpa: "83",
    }
  ],
  skills: [
    { id: "1", name: "Python" },
    { id: "2", name: "C" },
    { id: "3", name: "Java" },
    { id: "4", name: "SQL" },
    { id: "5", name: "HTML/CSS" },
    { id: "6", name: "JavaScript" },
    { id: "7", name: "MySQL workbench" },
    { id: "8", name: "Supabase" },
    { id: "9", name: "Firebase" },
    { id: "10", name: "Git" },
    { id: "11", name: "VS Code" },
    { id: "12", name: "Linux Terminal" },
    { id: "13", name: "Google Collab" },
    { id: "14", name: "Godot engine" },
    { id: "15", name: "CTF (Web/Crypto)" },
    { id: "16", name: "Vulnerability Analysis" },
    { id: "17", name: "Network Debugging (Wireshark/Burp Suite)" },
  ],
  courses: [
    { id: "1", name: "אבטחת מידע וקריפטולוגיה", grade: "98" },
    { id: "2", name: "שיטות הנדסיות לפיתוח מערכות תוכנה (Full-stack)", grade: "93" },
    { id: "3", name: "למידה עמוקה לראיית מכונה", grade: "93" },
    { id: "4", name: "מבוא למדעי המחשב (Python)", grade: "91" },
    { id: "5", name: "מבוא למחשוב ענן", grade: "100" },
    { id: "6", name: "טכנולוגיות אינטרנט WEB מתקדמות", grade: "98" },
  ],
  military: [
    {
      id: "1",
      role: "Soldier",
      dates: "2014 - 2017",
      description: "שירות צבאי מלא כלוחם בחיל השריון",
    }
  ],
  languages: [
    { id: "1", name: "Hebrew" },
    { id: "2", name: "English" },
  ],
  links: [
    { id: "1", name: "LinkedIn", url: "https://www.linkedin.com/in/yarden-bar-el-731a44247/" },
    { id: "2", name: "GitHub", url: "https://github.com/dsaadss?tab=repositories" },
  ],
  projects: [
    {
      id: "1",
      name: "פרויקט 1: Go Nature",
      description: "מערכת Full-Stack לניהול פארקים וגנים לאומיים. פיתוח מערכת המאפשרת ניהול פעולות למשתמשי קצה ומנהלים, כולל ניהול מסד נתונים MySQL.",
    },
    {
      id: "2",
      name: "פרויקט 2: מערכת נוכחות חכמה",
      description: "מערכת Web לניהול ומעקב נוכחות בבתי ספר. פיתוח אפליקציה למעקב נוכחות באמצעות סריקת ברקוד וקוד דינמי, כולל הפקת דוחות אוטומטיים וניהול מסד נתונים.",
    },
    {
      id: "3",
      name: "פרויקט 3: הליכון מסייע חכם (IoT)",
      description: "מערכת IoT לשיפור יציבות ושיווי משקל. פיתוח על פלטפורמת M5Stack ב-MicroPython לקריאת חיישני לחץ ומתן פידבק למשתמש בזמן אמת.",
    }
  ],
  appendixImages: [],
};

export const emptyResumeData: ResumeData = {
  template: "classic",
  settings: {
    padding: 8,
    sectionPadding: {},
    headlines: {},
    sidebarOrder: ['personal', 'links', 'skills', 'languages'],
    mainOrder: ['summary', 'experience', 'education', 'courses', 'military', 'projects'],
    skillsFormat: 'bullets'
  },
  personal: {
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    address: "",
    idNumber: "",
    profileImages: [],
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  courses: [],
  military: [],
  languages: [],
  links: [],
  projects: [],
  appendixImages: [],
};
