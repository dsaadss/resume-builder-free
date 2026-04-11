import { ResumeData, emptyResumeData, initialResumeData } from './types';
import { v4 as uuidv4 } from 'uuid';

export const fakeData1: ResumeData = {
  ...initialResumeData,
  themeColor: "#0f766e", // Teal
  personal: {
    firstName: "אביב",
    lastName: "כרמלי",
    title: "Senior Product Designer",
    email: "aviv.design@example.com",
    phone: "052-1234567",
    address: "תל אביב, ישראל",
    idNumber: "",
    profileImages: [], // Keeping blank to let user upload
    activeProfileImageId: undefined
  },
  summary: "מעצבת מוצר קריאייטיבית עם למעלה מ-5 שנות ניסיון בהובלת תהליכי עיצוב מבוססי משתמש, החל משלב המחקר ועד למסירת עיצוב למפתחים בעבודה בסביבות אג'יליות (Agile). התמחות בעיצוב אפליקציות מסובכות וחווית משתמש לעולמות ה-FinTech.",
  experience: [
    {
      id: uuidv4(),
      role: "Lead Product Designer",
      company: "FinTech Group",
      dates: "2020 - נוכחי",
      description: "- הובלת צוות של 3 פרילנסרים באפיון ועיצוב מחדש של האפליקציה המרכזית\n- יצירת Design System מקצה לקצה אשר חסך כ-30% מזמן הפיתוח הכללי של הצוות\n- העלאת מדד שביעות הרצון (CSAT) של לקוחות קצה ב-25% מיד לאחר ההשקה"
    },
    {
      id: uuidv4(),
      role: "UX/UI Designer",
      company: "Startup Nation Ltd",
      dates: "2017 - 2020",
      description: "- גיבוש Wireframes מתקדמים וביצוע בדיקות משתמשים ליישור תהליכים מורכבים\n- שיתוף פעולה פורה מול מנהלי מוצר ומפתחים ליצירת חוויות עקביות\n- קבלת פרס 'העיצוב החדשני ביותר' לשנת 2018 בכנס העיצוב השנתי"
    }
  ],
  education: [
    {
      id: uuidv4(),
      degree: "B.Des בעיצוב תקשורת חזותית",
      institution: "בצלאל אקדמיה לאמנות ועיצוב",
      dates: "2013 - 2017",
      gpa: ""
    }
  ],
  courses: [
    {
      id: uuidv4(),
      name: "קורס UX Master",
      grade: "הצטיינות יתרה"
    }
  ],
  projects: [
    {
      id: uuidv4(),
      name: "אפליקציית ניהול הוצאות",
      description: "תכנון ועיצוב פרויקט קונספטואלי לאפליקציית חיסכון והוצאות מבוססת AI שנוצרה כחלק מתיק העבודות, עם תמיכה מלאה במצבי Dark Mode ואנימציות Lottie."
    }
  ],
  skills: [
    { id: uuidv4(), name: "Figma" },
    { id: uuidv4(), name: "Adobe Creative Suite" },
    { id: uuidv4(), name: "Prototyping" },
    { id: uuidv4(), name: "User Research" },
    { id: uuidv4(), name: "Design Systems" },
    { id: uuidv4(), name: "Webflow" }
  ],
  military: [
    {
      id: uuidv4(),
      role: "מפקדת בקורס מפקדים",
      dates: "2011 - 2013",
      description: "פיקוד על מחלקה בת 30 צוערים, ניהול לוז קפדני והדרכה במגוון תחומים."
    }
  ],
  languages: [
    { id: uuidv4(), name: "עברית (שפת אם)" },
    { id: uuidv4(), name: "אנגלית (ברמת שפת אם)" },
    { id: uuidv4(), name: "ספרדית (בסיסי)" }
  ],
  links: [
    { id: uuidv4(), name: "Dribbble Portfolio", url: "https://dribbble.com" },
    { id: uuidv4(), name: "LinkedIn", url: "https://linkedin.com" }
  ]
};

export const fakeData2: ResumeData = {
  ...initialResumeData,
  themeColor: "#6b21a8", // Purple
  personal: {
    firstName: "דניאל",
    lastName: "עוז",
    title: "מנהל שיווק דיגיטלי | Digital Marketing Manager",
    email: "daniel.oz@example.com",
    phone: "050-9876543",
    address: "חיפה, ישראל",
    idNumber: "",
    profileImages: [], 
    activeProfileImageId: undefined
  },
  summary: "איש שיווק מיקוד מבוסס תוצאות (Performance Marketing) בעל חיבה לאנליזה ונתונים. מנוסה בניהול תקציבי ענק, בבניית קמפיינים מורכבים במגוון פלטפורמות תוך הקפדה על מקסום ה-ROI. מתעדכן תמידית בחידושי האלגוריתמים ומייצר אסטרטגיות Growth נדירות לצמיחה.",
  experience: [
    {
      id: uuidv4(),
      role: "מנהל מחלקת שיווק",
      company: "TechGear eCommerce",
      dates: "2021 - כיום",
      description: "- ניהול תקציב פרסום של כ-1,000,000 ש\"ח בחודש במגוון פלטפורמות (Google Ads, Meta, TikTok)\n- הגדלת נתח ההמרות ב-60% דרך A/B Testing סופר אגרסיבי של עמודי הנחיתה והקריאייטיב\n- ניהול צוות של 5 קמפיינרים, מנהלי מדיה חברתית ואנליסטים"
    },
    {
      id: uuidv4(),
      role: "PPC Campaign Manager",
      company: "ClickBoost Agency",
      dates: "2018 - 2021",
      description: "- הקמה ואופטימיזציה של למעלה מ-150 קמפיינים ל-B2B ו-B2C לחברות בינלאומיות\n- שיפור ממוצע של 40% ב-CPA לכל לקוחות העוגן של החברה"
    }
  ],
  education: [
    {
      id: uuidv4(),
      degree: "B.A. במנהל עסקים והתמחות בשיווק",
      institution: "אוניברסיטת רייכמן",
      dates: "2015 - 2018",
      gpa: "88"
    }
  ],
  courses: [],
  projects: [],
  skills: [
    { id: uuidv4(), name: "Google Analytics 4" },
    { id: uuidv4(), name: "Google Tag Manager" },
    { id: uuidv4(), name: "Facebook Ads Manager" },
    { id: uuidv4(), name: "TikTok Ads" },
    { id: uuidv4(), name: "SEO Optimization" },
    { id: uuidv4(), name: "Data Analysis (Looker / Tableau)" }
  ],
  military: [],
  languages: [
    { id: uuidv4(), name: "עברית" },
    { id: uuidv4(), name: "אנגלית" }
  ],
  links: [
    { id: uuidv4(), name: "LinkedIn", url: "https://linkedin.com" }
  ]
};

export const fakeData3: ResumeData = {
  ...initialResumeData,
  themeColor: "#1e3a8a", // Dark Blue
  personal: {
    firstName: "עומר",
    lastName: "יצחקי",
    title: "מהנדס מכונות | Mechanical Engineer",
    email: "omereng@example.com",
    phone: "053-4455667",
    address: "באר שבע, ישראל",
    idNumber: "",
    profileImages: [], 
    activeProfileImageId: undefined
  },
  settings: {
    padding: 10,
    sectionPadding: {},
    headlines: {},
    sidebarOrder: ['personal', 'links', 'languages', 'skills'],
    mainOrder: ['summary', 'education', 'experience', 'projects', 'military', 'courses'],
    skillsFormat: 'comma-separated'
  },
  summary: "מהנדס מכונות בעל גישה רוחבית למערכות אלקטרו-מכאניות ותשוקה אמיתית להנדסה ירוקה ולפתרון בעיות דינמיות. ניסיון בסימולציות, תרמודינמיקה ועבודה פראקטית בשטח במתקני אנרגיה סולארית.",
  experience: [
    {
      id: uuidv4(),
      role: "מהנדס פיתוח פרויקטים",
      company: "Solar Dynamics Inc",
      dates: "2020 - הווה",
      description: "- תכנון שדה תרמו-סולארי גדול המספק כ-50 מגה-וואט חשמל לרשת גריד מקומית\n- כתיבת מפרטים למערכות אינסטלציה מורכבות תוך תאום מול קבלני משנה ושמירה על זמני תקן"
    }
  ],
  education: [
    {
      id: uuidv4(),
      degree: "B.Sc בהנדסת מכונות",
      institution: "אוניברסיטת בן-גוריון בנגב",
      dates: "2015 - 2019",
      gpa: "85"
    }
  ],
  courses: [],
  projects: [
    {
      id: uuidv4(),
      name: "פרויקט גמר: מנוע המרה תרמי-מכאני קטן",
      description: "תכנון וייצור של אב טיפוס למנוע המנצל שיירי חום והופך אותו בחזרה לאנרגיה שימושית פנימית להגברת נצילות סביבתית, בסבסוד רשות החדשנות."
    }
  ],
  skills: [
    { id: uuidv4(), name: "SolidWorks" },
    { id: uuidv4(), name: "AutoCAD" },
    { id: uuidv4(), name: "MATLAB" },
    { id: uuidv4(), name: "Thermodynamic Simulations" },
    { id: uuidv4(), name: "Fluid Dynamics" },
    { id: uuidv4(), name: "Project Management" }
  ],
  military: [
    {
      id: uuidv4(),
      role: "טכנאי חיל האוויר",
      dates: "2011 - 2014",
      description: "תחזוקת כלי טיס בדרג א' וביצוע עבודות שגרתיות לאחזקת מנועים ברמת אמינות עילאית."
    }
  ],
  languages: [
    { id: uuidv4(), name: "עברית" },
    { id: uuidv4(), name: "אנגלית" }
  ],
  links: []
};

// Array exported for easy cycling
export const getFakeDataProfiles = () => [fakeData1, fakeData2, fakeData3];
