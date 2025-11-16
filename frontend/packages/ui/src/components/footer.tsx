"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/useIsMobile";
import DocumentViewer from "./DocumentViewer";

type DocKey = "terms" | "privacy" | "about";

export function Footer() {
  const isMobile = useIsMobile();
  const [openDoc, setOpenDoc] = useState<DocKey | null>(null);

  const handleOpen = (doc: DocKey) => setOpenDoc(doc);
  const handleClose = () => setOpenDoc(null);

  const docs: Record<DocKey, { title: string; content: React.ReactNode }> = {
    // =============== תנאי שימוש ===============
    terms: {
      title: "תנאי שימוש",
      content: (
        <>
          <p>
            השימוש באתר ובשירותי <strong>Hiilo</strong> מהווה הסכמה לתנאים
            הבאים. אם אינך מסכים להם, אנא אל תשתמש באתר או בשירותים שלנו.
          </p>

          <p>
            האתר והשירותים מוצעים לשימוש כפי שהם (AS IS). Hiilo אינה אחראית
            לנזקים ישירים או עקיפים הנובעים מהשימוש באתר. החברה שומרת לעצמה את
            הזכות לשנות את התנאים מעת לעת ללא הודעה מוקדמת.
          </p>

          <p>
            המשתמש מתחייב להשתמש בשירותים בהתאם לדין, בתום לב וללא כל פגיעה
            בצדדים שלישיים. החברה רשאית להפסיק את השימוש באתר למשתמש שהפר את
            התנאים.
          </p>

          <p>
            כל התכנים, הסימנים המסחריים, העיצובים והמידע באתר הם רכושה הבלעדי של
            Hiilo ואין להעתיקם או לעשות בהם שימוש ללא אישור מראש ובכתב.
          </p>

          <p>
            לשאלות ניתן לפנות לכתובת:
            <a
              href="mailto:office@hiiloworld.com"
              className="text-brand-green underline ms-1"
            >
              office@hiiloworld.com
            </a>
          </p>

          <p className="font-medium mt-6">עדכון אחרון: אוקטובר 2025</p>
        </>
      ),
    },

    // =============== מדיניות פרטיות ===============
    privacy: {
      title: "מדיניות פרטיות",
      content: (
        <>
          <p>
            חברת <strong>Hiilo</strong> מכבדת את פרטיות המשתמשים באתר ובאפליקציה
            שלה. מסמך זה מפרט כיצד אנו אוספים, שומרים ומשתמשים במידע האישי שלך.
          </p>

          <h3 className="text-2xl font-semibold mt-6">1. מידע שנאסף</h3>
          <ul className="list-disc pr-6 space-y-1">
            <li>שם, כתובת דוא״ל ומספר טלפון.</li>
            <li>פרטי תשלום בעת רכישה.</li>
            <li>מידע טכני: כתובת IP, סוג דפדפן, מיקום משוער.</li>
            <li>מידע שתמסור בטפסים או ביצירת קשר עם החברה.</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">2. שימוש במידע</h3>
          <ul className="list-disc pr-6 space-y-1">
            <li>לספק את השירותים שביקשת מאיתנו.</li>
            <li>לשפר את חוויית המשתמש באתר ובאפליקציה.</li>
            <li>לקיים תקשורת שיווקית בכפוף להסכמה.</li>
            <li>לעמוד בהוראות החוק ולמנוע הונאה או שימוש לרעה.</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">3. העברת מידע</h3>
          <p>
            אנו לא נעביר מידע אישי לצדדים שלישיים אלא במקרים הבאים:
            לצורך מתן השירות בפועל, כאשר קיימת חובה חוקית, או במקרה של מיזוג או
            רכישת החברה – בכפוף לשמירה על פרטיותך.
          </p>

          <h3 className="text-2xl font-semibold mt-6">4. שמירת מידע</h3>
          <p>
            המידע האישי נשמר במאגרי החברה לפרק הזמן הדרוש למימוש מטרות המדיניות.
            אינך חייב למסור מידע אישי, אך ייתכן שחלק מהשירותים לא יסופקו בלעדיו.
          </p>

          <h3 className="text-2xl font-semibold mt-6">5. זכויות המשתמש</h3>
          <p>
            תוכל לעיין במידע שלך, לבקש את מחיקתו או תיקונו באמצעות פנייה לכתובת:
            <a
              href="mailto:service@hiiloworld.com"
              className="text-brand-green underline ms-1"
            >
              service@hiiloworld.com
            </a>
          </p>

          <p className="font-medium mt-6">עדכון אחרון: מרץ 2023</p>
        </>
      ),
    },

    // =============== אודות Hiilo ===============
    about: {
      title: "אודות Hiilo",
      content: (
        <>
          <p>
            <strong>Hiilo</strong> הוא מותג תקשורת חדש שנולד כדי לשנות את הדרך
            שבה מטיילים נשארים מחוברים.  
            המטרה שלנו היא לספק חוויית גלישה פשוטה, שקופה ומשתלמת – בלי אותיות
            קטנות, בלי בלבול, ובלי הפתעות.
          </p>

          <p>
            אנחנו מציעים חבילות <strong>eSIM</strong> פשוטות, נגישות וללא הגבלה
            אמיתית – כך שתוכלו לטייל בראש שקט, בלי לחשוב על סיום חבילת הגלישה
            באמצע היום.
          </p>

          <h3 className="text-2xl font-semibold mt-6">מה מייחד אותנו?</h3>
          <ul className="list-disc pr-6 space-y-1">
            <li>שקיפות מלאה – בלי אותיות קטנות ובלי טריקים.</li>
            <li>חיבור אמין ויציב בכל העולם.</li>
            <li>שירות לקוחות אנושי, מהיר וזמין.</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">חזון</h3>
          <p>
            להפוך את Hiilo לשם נרדף לחיבור חכם, פשוט ומשתלם בעולם התיירות –
            כדי שכל ישראלי יוכל לטוס בראש שקט, עם אינטרנט שהוא יכול לסמוך עליו.
          </p>
        </>
      ),
    },
  };

  const links = [
    { label: "תנאי שימוש", onClick: () => handleOpen("terms") },
    { label: "מדיניות פרטיות", onClick: () => handleOpen("privacy") },
    { label: "אודות", onClick: () => handleOpen("about") },
    { href: "https://wa.me/972XXXXXXXXX", label: "צרו קשר" },
  ];

  return (
    <>
      <footer
        className={cn(
          "relative bg-brand-dark text-brand-white overflow-hidden mt-20",
          isMobile ? "rounded-t-[50px]" : "rounded-t-[100px]"
        )}
        dir="rtl"
      >
        <div className="container mx-auto px-6 py-14 flex flex-col items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-green">Hiilo</span>
          </Link>

          <ul className="flex flex-wrap justify-center gap-6 text-center">
            {links.map((link, i) => (
              <li key={i}>
                {link.onClick ? (
                  <button
                    onClick={link.onClick}
                    className="text-brand-white hover:text-brand-green transition-colors text-base"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    href={link.href!}
                    className="text-brand-white hover:text-brand-green transition-colors text-base"
                    target="_blank"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="bg-[#2EE59D] w-full py-4 mt-8">
            <p className="text-center text-[#1B2B3A] text-sm font-medium">
              © 2025 Hiilo. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>

      {openDoc && (
        <DocumentViewer
          title={docs[openDoc].title}
          content={docs[openDoc].content}
          onClose={handleClose}
        />
      )}
    </>
  );
}