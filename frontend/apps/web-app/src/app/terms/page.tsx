"use client";

export default function TermsPage() {
  return (
    <main className="container mx-auto py-16 text-right leading-7">
      <h1 className="text-3xl font-bold mb-8 text-brand-green">תנאי שימוש</h1>
      <div className="space-y-5 text-lg">
        <p>
          תנאי שימוש אלה מגדירים את מערכת היחסים בין המשתמש לבין חברת Hiilo
          בכל הנוגע לשימוש באתר ובשירותי ה-eSIM המוצעים בו.
        </p>
        <ul className="list-disc pr-6 space-y-2">
          <li>השימוש באתר מהווה הסכמה לתנאים אלה במלואם.</li>
          <li>השירותים ניתנים כפי שהם (AS-IS) ואינם מהווים התחייבות לתוצאה.</li>
          <li>החברה רשאית לשנות, לעדכן או להפסיק שירותים לפי שיקול דעתה.</li>
          <li>המשתמש מתחייב שלא להשתמש בשירותים למטרות בלתי חוקיות.</li>
          <li>במקרה של סתירה, יגבר הנוסח המעודכן באתר.</li>
        </ul>
        <p>
          החברה שומרת לעצמה את הזכות לעדכן את התנאים מעת לעת. מועד העדכון
          האחרון יופיע בתחתית העמוד.
        </p>
        <p className="font-medium mt-6">
          עדכון אחרון: אוקטובר 2025
        </p>
      </div>
    </main>
  );
}
