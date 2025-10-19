"use client";

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto py-16 text-right leading-7">
      <h1 className="text-3xl font-bold mb-8 text-brand-green">מדיניות פרטיות</h1>
      <div className="space-y-5 text-lg">
        <p>
          Hiilo מכבדת את פרטיות המשתמשים באתר ובאפליקציה שלה. מדיניות זו מפרטת
          כיצד אנו אוספים, שומרים ומשתמשים במידע האישי שלך במהלך השימוש באתר.
        </p>
        <ul className="list-disc pr-6 space-y-2">
          <li>אנו עשויים לאסוף פרטים אישיים כגון שם, טלפון וכתובת דוא״ל.</li>
          <li>המידע משמש למתן שירות, שיפור חוויית המשתמש ושליחת עדכונים.</li>
          <li>החברה אינה מעבירה מידע לצדדים שלישיים אלא במקרים הנדרשים על פי חוק.</li>
          <li>האתר משתמש בעוגיות (Cookies) לצורך תפעול שוטף וסטטיסטיקות.</li>
          <li>תוכל לפנות אלינו בכל עת לבקשת עיון, עדכון או מחיקה של מידע אישי.</li>
        </ul>
        <p>
          אנו נוקטים באמצעי אבטחה מחמירים להגנה על פרטיותך, אך איננו יכולים
          להבטיח חסינות מוחלטת מפני גישה בלתי מורשית. המשך שימושך באתר מהווה
          הסכמה למדיניות זו.
        </p>
        <p className="font-medium">
          ליצירת קשר: <a href="mailto:service@hiiloworld.com" className="text-brand-green underline">service@hiiloworld.com</a>
        </p>
      </div>
    </main>
  );
}
