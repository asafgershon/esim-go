"use client";

import { useState } from "react";
import {
  Button,
  IconButton,
  Navbar,
  UserIcon,
  useScrollTo,
} from "@workspace/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import type { RefObject } from "react";
import type { SmoothScrollHandle } from "@workspace/ui";
import { useAuth } from "@/hooks/useAuth";
import DocumentViewer from "./DocumentViewer";

type DocKey = "about";

export function Header({
  scrollContainerRef,
}: {
  scrollContainerRef?: RefObject<SmoothScrollHandle | null>;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { scrollTo } = useScrollTo({ scrollContainerRef });
  const [, setShowLogin] = useQueryState(
    "showLogin",
    parseAsBoolean.withDefault(false)
  );

  const [openDoc, setOpenDoc] = useState<DocKey | null>(null);

  const handleUserClick = () => {
    if (isAuthenticated) {
      router.push("/profile");
    } else {
      setShowLogin(true);
    }
  };

  // ✅ MUST come before handleNavigate
  const navigation = [
    { title: "מדריך התקנה", href: "/how-to-install", external: false },
    { title: "שאלות ותשובות", href: "#faq", external: false },
    { title: "?eSim מה זה", href: "#what-is-esim", external: false },
    { title: "עלינו", href: "#about", external: false }, // ✅ override path
    { title: "ביקורות", href: "#reviews", external: false },
  ];

  // ✅ REAL FIX — href, not title
  const handleNavigate = (href: string, external?: boolean) => {
    // ✅ "עלינו" override
    if (href === "#about") {
      setOpenDoc("about");
      return;
    }

    // ✅ external link
    if (external) {
      router.push(href);
      return;
    }

    // ✅ anchor scroll
    if (href.startsWith("#")) {
      scrollTo(href);
    }
  };

  const logo = (
    <Link href="/" className="flex items-center">
      <Image
        src="/images/logos/logo-header.svg"
        alt="Hiilo"
        width={60}
        height={20}
        className="h-5 w-auto"
        priority
      />
    </Link>
  );

  const desktopActions = (
    <div className="flex items-center gap-2">
      <IconButton
        variant="brand-primary"
        size="default"
        onClick={handleUserClick}
      >
        <UserIcon />
      </IconButton>
      <Button
        variant="brand-secondary"
        size="default"
        emphasized
        onClick={() => scrollTo("#contact")}
      >
        צריכים עזרה בהזמנה?
      </Button>
    </div>
  );

  const mobileActions = (
    <div className="w-full">
      <div className="flex items-center gap-2 justify-center">
        <IconButton
          variant="brand-primary"
          size="default"
          onClick={handleUserClick}
        >
          <UserIcon />
        </IconButton>
        <Button
          variant="brand-secondary"
          emphasized
          size="default"
          onClick={() => scrollTo("#contact")}
        >
          צריכים עזרה בהזמנה?
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Navbar
        logo={logo}
        items={navigation}
        actions={desktopActions}
        mobileActions={mobileActions}
        className="bg-white"
        onNavigate={(href, external) => handleNavigate(href, external)}
      />

      {openDoc && (
        <DocumentViewer
          title="אודות Hiilo"
          content={
            <div className="text-right space-y-4 leading-relaxed" dir="rtl">
              <h3 className="text-2xl font-semibold mt-4">אודות Hiilo</h3>

              <p>
                Hiilo הוא מותג תקשורת חדש ונועז, שנועד לתת מענה למטיילים של היום – כאלה שלא מוכנים להתפשר על איכות,
                חוויית שימוש ושקיפות.
              </p>

              <p>
                אנחנו מציעים חבילות eSIM ללא הגבלה — פשוטות, משתלמות, וללא כאבי ראש של חבילות יומיות מבלבלות או צורך
                לרכוש שוב ושוב נפחי גלישה. בין אם אתם טסים לסופ"ש קצר באירופה, לחופשה משפחתית, לטיול אחרי צבא או לשבוע
                סקי עם החבר'ה – Hiilo דואגת שתישארו מחוברים מרגע הנחיתה ועד החזרה הביתה.
              </p>

              <h4 className="text-xl font-bold mt-6">מה מייחד אותנו?</h4>

              <p>
                <strong>חבילה אחת – ראש שקט לכל הטיול:</strong> אצלנו יש חבילה אחת, פשוטה וברורה – בלי להסתבך עם הגדרות,
                בלי לחשוב ימים ובלי לחשוש שתיגמר הגלישה באמצע היום.
              </p>

              <p>
                <strong>החופש לטייל – בלי לחשוב על הגלישה:</strong> בדיקת מייל, הזמנת רכב, העלאת תמונות או שיחת וידאו –
                השירות שלנו מתאים לכל שימוש בטיול. ההתחברות מתבצעת תוך דקות, בלי כרטיסים פיזיים ובלי הפתעות במחיר.
              </p>

              <p>
                <strong>אנחנו מטיילים בדיוק כמוכם:</strong> Hiilo קמה מתוך ההבנה שבטיול הדבר החשוב באמת הוא להרגיש חופשי.
                לכן בנינו מוצר יציב, משתלם ומותאם באמת לצרכים של מטיילים — ולא כזה שנועד לבלבל אתכם כדי למקסם רווחים.
              </p>

              <p>
                <strong>שקיפות מעל הכול:</strong> בניגוד לשחקנים אחרים בשוק, אצלנו אין אותיות קטנות ולא “מבצעים” מטעים.
                אנחנו מאמינים בתמחור שקוף ושירות מצוין — נקודה.
              </p>

              <h4 className="text-xl font-bold mt-6">לאן אנחנו שואפים להגיע?</h4>

              <p>
                אנחנו רק בתחילת הדרך — אבל כבר עכשיו רואים רחוק. Hiilo נולדה מתוך הבנה עמוקה של עולם התיירות החדש והיא
                שואפת להפוך לשם נרדף לחיבור חכם, פשוט ומשתלם בחו״ל.
              </p>

              <p>
                באמצעות ערוצי הפצה חכמים, אנחנו בונים מותג שצומח במהירות, מחובר לקהל, ומספק פתרונות אמיתיים לצרכים של
                הדור המטייל.
              </p>

              <p>
                החזון שלנו פשוט — שכל מטייל ישראלי יוכל לטוס בראש שקט ולדעת שיש לו אינטרנט שהוא באמת יכול לסמוך עליו.
              </p>
            </div>
          }
          onClose={() => setOpenDoc(null)}
        />
      )}
    </>
  );
}
