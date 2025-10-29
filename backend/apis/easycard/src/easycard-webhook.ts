// /api/easycard/webhook.ts (דוגמה ל-API Route)

// ייבוא הלוגיקה לטיפול בטרנזקציה (שימוש בשם הפונקציה הנכון: completeOrder)
import { completeOrder } from '@server/services/checkout/workflow'; 
// נניח שאתה צריך גם לוגר (logger) והקונטקסט (context) שלך
// import { logger } from '@server/lib/logger'; 
// import type { Context } from '@server/context/types';


export default async function easycardWebhookHandler(req: any, res: any) {
    // ⚠️ הערה: יש לוודא שה-handler שלכם יודע לטפל רק בבקשות POST.
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const webhookData = req.body;
        
        // 1. ולידציה בסיסית של ה-Webhook
        if (webhookData.entityType !== 'PaymentTransaction') {
            // אנו מטפלים רק באירועי תשלום, שאר האירועים לא רלוונטיים
            return res.status(200).json({ received: true, message: "Ignoring non-payment event" });
        }

        // 2. הפעלת הלוגיקה העסקית החזקה (שימוש ב-completeOrder)
        // ⚠️ שימוש ב-entityReference ו-entityExternalReference כפי שגילינו בתיעוד
        const result = await completeOrder({
            sessionId: webhookData.entityExternalReference, // ה-sessionId שלנו
            easycardTransactionId: webhookData.entityReference, // ה-transactionID של איזיקארד
            // completeOrder לא מקבל eventName ו-isFailureEvent, היא בודקת את הסטטוס בעצמה
        });


        // 3. אישור לאיזיקארד שהטיפול הסתיים בהצלחה
        // זה קריטי! אם לא נשלח 200, איזיקארד ימשיכו לשלוח.
        // אנו מניחים ש-completeOrder טיפלה גם במקרים כושלים/ממתינים.
        if (result.status === 'COMPLETED') {
            return res.status(200).json({ success: true, status: result.status, orderId: result.orderId });
        } else {
             // אם זה FAILED/PENDING, נשמור 200 כדי לא לחזור על השליחה, אבל נדווח על הכישלון.
            return res.status(200).json({ success: true, status: result.status, message: "Order failed or pending completion." });
        }


    } catch (error: any) {
        // 4. רישום שגיאה ושליחת 500 כדי לבקש מאיזיקארד לנסות שוב
        console.error('Webhook processing failed (Internal Error):', error.message);
        
        // אנו שולחים 500 כדי להורות לאיזיקארד לנסות לשלוח את ה-Webhook שוב מאוחר יותר.
        return res.status(500).json({ success: false, message: "Internal server error, please retry." });
    }
}