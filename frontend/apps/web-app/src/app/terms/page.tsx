import DocumentPage from "@/components/DocumentPage";

export default function TermsPage() {
  return (
    <DocumentPage
      title="תנאי שימוש"
      content={
        <>
          <p>
            השימוש באתר ובשירותי <strong>Hiilo</strong> מהווה הסכמה לתנאים
            הבאים. אם אינך מסכים להם, אנא אל תשתמש באתר או בשירותים שלנו.
          </p>

          <h2 className="text-2xl font-semibold mt-6">1. כללי</h2>
          <p>
            האתר נועד לספק מידע ושירותים בתחום חבילות eSIM. כל שימוש ייעשה
            בהתאם לתנאים אלה ובהתאם לחוקי מדינת ישראל.
          </p>

          <h2 className="text-2xl font-semibold mt-6">2. אחריות המשתמש</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>המשתמש אחראי על כל פעולה המתבצעת מחשבונו באתר.</li>
            <li>אין להשתמש באתר למטרות בלתי חוקיות או מסחריות ללא אישור מראש.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6">3. הגבלת אחריות</h2>
          <p>
            השירותים ניתנים כפי שהם (AS IS). החברה לא תהיה אחראית לכל נזק ישיר או
            עקיף שייגרם עקב שימוש באתר או בשירותים.
          </p>

          <h2 className="text-2xl font-semibold mt-6">4. שינוי תנאים</h2>
          <p>
            החברה רשאית לשנות את תנאי השימוש בכל עת. מועד העדכון האחרון יופיע
            בתחתית הדף.
          </p>

          <h2 className="text-2xl font-semibold mt-6">5. יצירת קשר</h2>
          <p>
            לשאלות או הבהרות ניתן לפנות לכתובת:{" "}
            <a
              href="mailto:office@hiiloworld.com"
              className="text-brand-green underline"
            >
              office@hiiloworld.com
            </a>
          </p>

          <p className="font-medium mt-6">עדכון אחרון: אוקטובר 2025</p>
        </>
      }
    />
  );
}
