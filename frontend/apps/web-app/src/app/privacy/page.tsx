/* eslint-disable react/no-unescaped-entities */
import DocumentPage from "@/components/DocumentPage";

export default function PrivacyPage() {
  return (
    <DocumentPage
      title="מדיניות פרטיות"
      content={
        <>
          <p>
            חברת <strong>Hiilo</strong> מכבדת את פרטיות המשתמשים באתר ובאפליקציה
            שלה. מדיניות זו מפרטת כיצד אנו אוספים, שומרים, משתמשים ומגנים על
            המידע האישי שמסרת לנו במהלך שימושך באתר.
          </p>

          <h2 className="text-2xl font-semibold mt-6">1. כללי</h2>
          <p>
            מדיניות זו חלה על כל משתמש המבקר או עושה שימוש כלשהו באתר, בין אם
            באמצעות מחשב, טלפון נייד או כל אמצעי אחר. השימוש באתר מהווה הסכמה
            למדיניות זו.
          </p>

          <h2 className="text-2xl font-semibold mt-6">2. מידע שנאסף</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>שם מלא ופרטי יצירת קשר.</li>
            <li>כתובת דוא"ל ומספר טלפון.</li>
            <li>פרטי תשלום בעת רכישה.</li>
            <li>מידע טכני – כתובת IP, סוג דפדפן, מערכת הפעלה ומיקום.</li>
            <li>מידע שתמסור באופן יזום, לדוגמה בטופס יצירת קשר.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6">3. מטרות השימוש</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>לספק את השירותים שביקשת.</li>
            <li>ליצור קשר במקרה הצורך.</li>
            <li>לייעל ולשפר את חוויית המשתמש.</li>
            <li>לעמוד בדרישות החוק.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6">4. העברת מידע לצדדים שלישיים</h2>
          <p>
            לא נעביר מידע אישי לצדדים שלישיים אלא אם נדרש על פי חוק, לצורך אספקת
            השירות בפועל, או במסגרת מיזוג/מכירה של החברה – בכפוף לשמירה על
            פרטיותך.
          </p>

          <h2 className="text-2xl font-semibold mt-6">5. הגנה על מידע</h2>
          <p>
            אנו נוקטים באמצעים טכנולוגיים וארגוניים סבירים לשמירה על המידע האישי
            שלך, אך איננו יכולים להבטיח חסינות מוחלטת מפני גישה לא מורשית.
          </p>

          <h2 className="text-2xl font-semibold mt-6">6. שמירת מידע</h2>
          <p>
            המידע יישמר לפרק הזמן הנדרש לצורך מימוש מטרות המדיניות ובהתאם להוראות
            החוק. אינך מחויב למסור מידע אישי, אך ייתכן שלא נוכל לספק לך שירותים
            מסוימים בלעדיו.
          </p>

          <h2 className="text-2xl font-semibold mt-6">7. זכויות המשתמש</h2>
          <p>
            באפשרותך לפנות אלינו בכל עת כדי לעיין במידע שלך, לעדכנו או לבקש את
            מחיקתו.  
            פניות בנושא ניתן לשלוח לכתובת:{" "}
            <a
              href="mailto:service@hiiloworld.com"
              className="text-brand-green underline"
            >
              service@hiiloworld.com
            </a>
          </p>
        </>
      }
    />
  );
}
