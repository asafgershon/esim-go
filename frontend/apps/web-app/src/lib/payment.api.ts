// קובץ: src/lib/payment.api.ts

// ממשק למה שאנחנו שולחים ליצירת תשלום
interface IPaymentItem {
  itemName: string;
  price: number;
  quantity: number;
  [key: string]: unknown;
}

interface ICreatePaymentPayload {
  amount: number;
  items: IPaymentItem[];
}

// ממשק לתשובה שאנו מצפים לקבל מהשרת שלנו
interface ICreatePaymentResponse {
  paymentUrl: string; // הקישור לדף התשלום של Easycard
}

// ממשק לתשובה מהשרת שלנו לאחר אימות
interface IVerifyPaymentResponse {
  success: boolean;
  message: string;
  status?: string; // הסטטוס הסופי מ-Easycard
}

/**
 * פונקציה 1: קריאה לשרת שלנו ליצירת קישור תשלום
 * @param payload - סכום ורשימת פריטים
 */
export async function createPaymentIntent(payload: ICreatePaymentPayload): Promise<ICreatePaymentResponse> {
  
  // ה-Endpoint שבנינו ב-app.ts
  const response = await fetch('/api/payment/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create payment intent');
  }

  return response.json();
}


/**
 * פונקציה 2: קריאה לשרת שלנו לאימות התשלום
 * @param transactionID - מזהה העסקה שקיבלנו ב-URL
 */
export async function verifyPayment(transactionID: string): Promise<IVerifyPaymentResponse> {
  
  // ה-Endpoint השני שבנינו ב-app.ts
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionID }),
  });

  // חשוב: גם אם התגובה היא "לא מאושר" (400), השרת עדיין עבד.
  // אנחנו רוצים להחזיר את התשובה הזו לפרונטאנד.
  const data = await response.json();
  
  if (!response.ok) {
    // זורק שגיאה רק אם השרת עצמו נפל (500)
    // אם זו שגיאה עסקית (כמו 'Payment not approved'), ה-success: false יטפל בזה.
    if (response.status >= 500) {
      throw new Error(data.message || 'Failed to verify payment');
    }
  }

  return data as IVerifyPaymentResponse;
}