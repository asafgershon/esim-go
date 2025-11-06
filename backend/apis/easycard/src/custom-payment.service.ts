import axios from 'axios';
import qs from 'qs';

// אנחנו מניחים שהקובץ .env נטען ע"י השרת הראשי שלך
// ושהמפתח זמין ב-process.env
const MY_API_KEY = process.env.EASY_CARD_PRIVATE_API_KEY;
const TOKEN_URL = "https://identity.e-c.co.il/connect/token";

// הכתובת של ה-API היא ב-subdomain נפרד
export const API_BASE_URL = "https://api.e-c.co.il/api";

// #############################################################
// #                שלב 1: אימות וקבלת טוקן                    #
// #############################################################

// ממשק (Interface) למה שאנחנו שומרים בזיכרון
interface IStoredToken {
    value: string | null;
    expiresAt: number; // Unix timestamp בשניות
}

// ממשק (Interface) לתשובה שמגיעה מהשרת טוקנים
interface ITokenResponse {
    access_token: string;
    expires_in: number; // מספר שניות
    token_type: string;
    scope: string;
}

/**
 * אנו נשמור את הטוקן בזיכרון ואת זמן התפוגה שלו
 * כדי לא לבקש טוקן חדש בכל קריאה ל-API.
 */
let storedToken: IStoredToken = {
    value: null,
    expiresAt: 0 
};

/**
 * פונקציה להשגת access token.
 * היא בודקת אם יש טוקן שמור ותקף, ואם לא, מביאה חדש.
 */
export async function getAccessToken(): Promise<string> {
    const nowInSeconds = Date.now() / 1000;

    // אם יש לנו טוקן והוא עדיין בתוקף (עם מרווח ביטחון של דקה)
    if (storedToken.value && storedToken.expiresAt > (nowInSeconds + 60)) {
        console.log("Using cached Easycard token");
        return storedToken.value;
    }

    // אם אין טוקן או שהוא פג תוקף, נביא חדש
    console.log("Fetching new Easycard token...");
    if (!MY_API_KEY) {
        throw new Error("EASY_CARD_PRIVATE_API_KEY is not defined in .env file.");
    }
    
    try {
        const data = {
            client_id: 'terminal',
            grant_type: 'terminal_rest_api',
            authorizationKey: MY_API_KEY
        };

        const response = await axios.post<ITokenResponse>(
            TOKEN_URL, 
            qs.stringify(data), 
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000,
                family: 4 
            }
        );

        const tokenData = response.data;

        // שמירת הטוקן וזמן התפוגה שלו
        storedToken.value = tokenData.access_token;
        storedToken.expiresAt = nowInSeconds + tokenData.expires_in; 

        console.log("New Easycard token fetched and cached.");
        return storedToken.value;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching Easycard token:', error.response?.data || error.message);
        } else {
            console.error('An unexpected error occurred:', error);
        }
        throw new Error("Failed to get Easycard authentication token.");
    }
}


// #############################################################
// #                    שלב 2: יצירת תשלום                     #
// #############################################################

// --- ממשקים (Interfaces) ---

interface IPaymentItem {
    itemName: string;
    price: number;
    quantity: number;
    currency?: string;
    vatRate?: number;
    [key: string]: any; // מאפשר שדות נוספים
}

// מתאר את המידע שאנחנו צריכים כדי ליצור בקשת תשלום
export interface ICreatePaymentParams {
    amount: number;         // סכום כולל
    items: IPaymentItem[];  // רשימת פריטים
    redirectUrl: string;    // הכתובת לחזרה לאתר שלנו (כדי לקבל transactionID)
    terminalID: string;     // מזהה הטרמינל שלך
    }

// מתאר את התשובה שאנו מצפים לקבל מ-Easycard
export interface IPaymentIntentResponse {
    message: string;
    status: string;
    entityUID: string;
    additionalData: {
        url: string; // זה הקישור לדף התשלום!
        applePayJavaScriptUrl?: string;
    };
    [key: string]: any; // מאפשר שדות נוספים
}


/**
 * פונקציה ליצירת Payment Intent (בקשת תשלום)
 * מקבלת את פרטי התשלום ומחזירה את הקישור לדף התשלום.
 */
export async function createPaymentIntent(params: ICreatePaymentParams): Promise<IPaymentIntentResponse> {
    
    // שלב 1: השג טוקן גישה
    const token = await getAccessToken();

    // שלב 2: הכן את גוף הבקשה (request body)
    const requestBody = {
        terminalID: params.terminalID,
        currency: "USD", // ניתן לשנות אם צריך
        invoiceType: "invoiceWithPaymentInfo",
        paymentRequestAmount: params.amount,
        issueInvoice: true,
        dealDetails: {},
        items: params.items.map(item => {
            // נפרק את האובייקט 'item' כדי למנוע כפילויות
            const { 
                itemName, 
                price, 
                quantity, 
                currency, 
                vatRate, 
                ...otherFields // זה יתפוס את כל השדות הנוספים
            } = item;

            // נבנה את האובייקט החדש בצורה נקייה
            return {
                itemID: "",
                itemName: itemName,
                price: price,
                discount: 0,
                currency: currency || "ILS",
                quantity: quantity,
                amount: price * quantity,
                vat: 0, 
                netAmount: price * quantity,
                vatRate: vatRate || 0,
                withoutVat: (vatRate || 0) === 0,
                ...otherFields // מעביר את כל השדות הנוספים בלי לדרוס כלום
            };
        }),
        invoiceDetails: {
            invoiceType: "invoiceWithPaymentInfo",
            invoiceLanguage: "en-IL",
            invoiceNumber: null,
            invoiceSubject: "Invoice from HiiloWorld"
        },
        redirectUrls: [params.redirectUrl], // לא רלוונטי כשאנו משתמשים ב-redirectUrl הראשי
        transactionSucceedUrl: params.redirectUrl, // לא נשתמש בזה, סומכים על redirectUrl
        transactionFailedUrl: params.redirectUrl,  // לא נשתמש בזה, סומכים על redirectUrl
        netTotal: params.amount,
        vatTotal: 0,
        vatRate: 0,
        userAmount: false,
        totalAmount: params.amount,
        amount: params.amount,
        transactionAmount: params.amount,
        transactionType: "regularDeal",
        jDealType: "J4",
        allowRegular: true,
        additionalFields: {},
        hideNationalID: true,
        paymentIntent: true,
        hidePhone: true,
        hideConsumerName:true,
        hideEmail:false
    };

    // שלב 3: בצע את קריאת ה-API
    const url = `${API_BASE_URL}/paymentintent`;
    console.log(`Creating payment intent to: ${url}`);

    try {
        const response = await axios.post<IPaymentIntentResponse>(
            url,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${token}`, // הוספת הטוקן ל-Header
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Payment intent created successfully.");
        return response.data;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error creating Easycard payment intent:', error.response?.data || error.message);
        } else {
            console.error('An unexpected error occurred:', error);
        }
        throw new Error("Failed to create Easycard payment intent.");
    }
}

/**
 * מקבל transactionId ומחזיר את ה-Payment Intent ID מתוך EasyCard
 */
export async function getIntentIdFromTransaction(transactionId: string): Promise<string | null> {
  const token = await getAccessToken();
  const url = `${API_BASE_URL}/transactions/${transactionId}`;
  console.log(`[Easycard] Fetching transaction details for ${transactionId}`);

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`[Easycard] Transaction info:`, data);

    // ✅ Easycard מחזירה בדיוק את זה, ראה בלוגים שלך:
    // "paymentIntentID": "15c46ee9-2f4b-42c7-935c-b38701242ace"
    const intentId =
      data.paymentIntentID ||
      data.PaymentIntentID || // fallback אם יש שוני באותיות
      data.payment_intent_id || // fallback נוסף (למקרה של שינוי עתידי)
      null;

    console.log(`[Easycard] Extracted paymentIntentID: ${intentId}`);
    return intentId;
  } catch (error: any) {
    console.error(`[Easycard] Failed to fetch transaction ${transactionId}:`, error.message);
    return null;
  }
}


// #############################################################
// #           שלב 3: אימות מאובטח של סטטוס עסקה               #
// #############################################################

// מתאר את התשובה שאנו מצפים לקבל מבדיקת הסטטוס
export interface ITransactionStatusResponse {
    id: string; // ה-transactionID
    status: string; // לדוגמה: "Approved", "Failed", "Pending"
    message: string;
    amount: number;
    currency: string;
    // ... יכולים להיות פה עוד שדות מהתיעוד
    [key: string]: any; 
}

/**
 * פונקציה לבדיקת סטטוס עסקה (שרת-מול-שרת)
 * מקבלת transactionID ומחזירה את פרטי העסקה המלאים.
 */
export async function getTransactionStatus(transactionID: string): Promise<ITransactionStatusResponse> {

    // 1. השג טוקן גישה
    const token = await getAccessToken();

    // 2. הגדרת הכתובת לבדיקת סטטוס
    // ⬇️ ⬇️ ⬇️ 
    // ⚠️ אזהרה חשובה: הנתיב המדויק לבדיקת סטטוס לא היה בתיעוד ששלחת.
    // אני מניח נתיב סטנדרטי. אנא ודא בתיעוד של Easycard
    // מהו ה-Endpoint הנכון לבדיקת סטטוס של עסקה (למשל GET /api/Transaction/...)
    const url = `${API_BASE_URL}/transactions/${transactionID}`; 
    // ⬆️ ⬆️ ⬆️

    console.log(`[Easycard] Verifying transaction status for: ${transactionID}`);
    console.log(`[Easycard] Calling URL: ${url}`);

    try {
        // 3. בצע קריאת GET מאובטחת
        const response = await axios.get<ITransactionStatusResponse>(
            url,
            {
                headers: {
                    'Authorization': `Bearer ${token}`, // הוספת הטוקן ל-Header
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[Easycard] Status received: ${response.data.status}`);
        return response.data; // מחזיר את כל פרטי העסקה

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`[Easycard] Error verifying transaction ${transactionID}:`, error.response?.data || error.message);
        } else {
            console.error(`[Easycard] An unexpected error occurred:`, error);
        }
        throw new Error("Failed to get Easycard transaction status.");
    }
}