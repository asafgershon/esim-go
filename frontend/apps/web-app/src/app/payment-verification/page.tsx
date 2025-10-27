// קובץ: src/app/payment-verification/page.tsx

"use client"; // 👈 חובה! זהו Client Component

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
// 🔽 ייבוא פונקציית האימות שלנו
import { verifyPayment } from '../../lib/payment.api'; 

type VerificationStatus = 'loading' | 'success' | 'error';

function PaymentVerification() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('מאמת את התשלום שלך...');

  useEffect(() => {
    // שלוף את ה-transactionID מה-URL
    const transactionID = searchParams.get('transactionID');

    if (!transactionID) {
      setStatus('error');
      setMessage('מזהה עסקה לא נמצא. אנא פנה לתמיכה.');
      return;
    }

    // פונקציה א-סינכרונית לבדיקת התשלום
    const verify = async () => {
      try {
        // קריאה ל-API שלנו (שרת-מול-שרת)
        const response = await verifyPayment(transactionID);

        if (response.success && response.status === 'Approved') {
          // 1. הצלחה!
          setStatus('success');
          setMessage('תודה רבה! התשלום אושר וההזמנה בדרך אליך.');
          
          // 💡 כאן המקום לנקות את עגלת הקניות, וכו'
          
        } else {
          // 2. כישלון (למשל, תשלום נדחה)
          setStatus('error');
          setMessage(`התשלום נכשל או לא אושר. סטטוס: ${response.message}`);
        }
      } catch (err: unknown) {
        // 3. שגיאת שרת
        setStatus('error');
        setMessage(`אירעה שגיאה באימות התשלום: ${err instanceof Error ? err.message : 'שגיאה לא ידועה'}`);
      }
    };

    verify(); // הפעל את פונקציית האימות
  }, [searchParams]); // הפעל רק פעם אחת כשהדף נטען

  
  // ----- הצגת פידבק למשתמש -----

  if (status === 'loading') {
    return (
      <div>
        <h1>מאמת...</h1>
        <p>{message}</p>
        {/* אפשר להוסיף כאן ספינר */}
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div>
        <h1>תודה רבה!</h1>
        <p>{message}</p>
        {/* אפשר להוסיף כאן קישור חזרה לדף הבית */}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div>
        <h1>אופס, התשלום נכשל</h1>
        <p>{message}</p>
        {/* אפשר להוסיף כאן כפתור "נסה שוב" שמוביל לעגלה */}
      </div>
    );
  }

  return null; // ברירת מחדל
}


// Next.js דורש לעטוף רכיבים שמשתמשים ב-useSearchParams ב-Suspense
// אז אנחנו מייצאים את הקומפוננטה עטופה
export default function PaymentVerificationPage() {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <PaymentVerification />
    </Suspense>
  );
}