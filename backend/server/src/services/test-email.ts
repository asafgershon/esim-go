import postmark from "postmark";
import fs from "fs";

// ⚙️ נתוני דמה לבדיקה
const name = "אסף גרשון";
const email = "asaf.gershon88@gmail.com"; // הכתובת שאליה יישלח
const order = { id: "ORDER-TEST-123456" };
const transactionInfo = { totalAmount: 89.9 };
const esimDetails = {
  activation: {
    qr_code: "https://via.placeholder.com/200x200.png?text=QR+Preview",
    lpa_string: "LPA:1$consumer.e-sim.global$TESTLPA12345",
    manual_activation_code: "ABCDEF1234567890",
  },
};

// 🟢 יצירת לקוח Postmark עם ה־API Token שלך
const postmarkClient = new postmark.ServerClient("eb7e4a97-3d71-4c8e-8bd0-f2c85fafaa28");

// 📨 שליחת מייל בדיקה
await postmarkClient.sendEmail({
  From: "office@hiiloworld.com",
  To: email,
  Subject: "ה-eSIM שלך מוכן",
  HtmlBody: `
  <!DOCTYPE html>
  <html dir="rtl" lang="he">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ה-eSIM שלך מוכן</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;direction:rtl;text-align:right;">
    <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f5f7;padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#008060 0%,#00B37A 100%);padding:35px 30px;text-align:center;">
                <img src="cid:logo-header.svg" alt="Hiilo logo" style="width:120px;height:auto;margin-bottom:10px;" />
                <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">ה-eSIM שלך מוכן</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:40px 30px;">
                <p style="margin:0 0 20px;font-size:18px;color:#1a1a1a;font-weight:600;">שלום ${name},</p>
                <p style="margin:0 0 12px;font-size:16px;color:#4a4a4a;">
                  צוות <strong style="color:#007A5E;">Hiilo</strong> מאחל לך חופשה לא פחות ממושלמת 🌴
                </p>
                <p style="margin:0 0 25px;font-size:14px;color:#777;">
                  מספר הזמנה:
                  <strong style="color:#007A5E;font-family:monospace;">${order.id}</strong>
                </p>

                <div style="height:2px;background:linear-gradient(to left,transparent,#00A97A,transparent);margin:30px 0;"></div>

                <!-- QR Section -->
                <div style="background:linear-gradient(135deg,#f5fff9 0%,#ffffff 100%);border-radius:12px;padding:30px;border:2px solid #c6f3e0;">
                  <h3 style="color:#007A5E;text-align:center;margin-bottom:20px;">סרוק את הקוד כדי להפעיל את ה-eSIM</h3>

                  <div style="text-align:center;">
                    <div style="border:3px solid #00A97A;border-radius:12px;padding:20px;display:inline-block;">
                      <img src="${esimDetails.activation.qr_code}" alt="QR Code" style="width:200px;height:200px;" />
                    </div>
                  </div>

                  <!-- iPhone -->
                  <div style="margin-top:25px;padding:20px;background:#f8fff9;border-radius:8px;border-right:4px solid #00A97A;text-align:center;">
                    <p style="font-size:13px;color:#333;font-weight:600;margin-bottom:8px;">משתמש ב-iPhone?</p>
                    <p style="font-size:13px;color:#555;margin:0;">תוכל ללחוץ על הכפתור הבא להפעלה ישירה:</p>
                    <div style="margin-top:16px;">
                      <a href="${esimDetails.activation.qr_code}" 
                         style="display:inline-block;background:#00A97A;color:#fff;padding:10px 22px;
                                border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
                        הפעל את ה-eSIM
                      </a>
                    </div>
                  </div>

                  <!-- Android -->
                  <div style="margin-top:25px;padding:20px;background:#f8f8f8;border-radius:8px;border-right:4px solid #007A5E;text-align:right;">
                    <p style="font-size:13px;color:#333;font-weight:600;margin-bottom:8px;">משתמש ב-Android?</p>
                    <p style="font-size:13px;color:#555;margin-bottom:12px;">
                      כנס להגדרות > רשת ניידת > הוסף eSIM ידנית<br/>
                      והעתק את הפרטים הבאים לשדות המתאימים:
                    </p>
                    <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:#444;">
                      <li><strong>כתובת SM-DP+:</strong> ${esimDetails.activation.lpa_string}</li>
                      <li><strong>קוד הפעלה (Activation Code):</strong> ${esimDetails.activation.manual_activation_code}</li>
                    </ul>
                  </div>
                </div>

                <!-- Support -->
                <div style="background:#f9f9f9;border-radius:8px;padding:20px;text-align:center;margin-top:30px;">
                  <p style="font-size:14px;color:#666;margin:0;">צריך עזרה?<br/>
                    <a href="mailto:office@hiiloworld.com" style="color:#00A97A;">office@hiiloworld.com</a>
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#fafafa;padding:30px;text-align:center;border-top:1px solid #eee;">
                <p style="margin:0;font-size:16px;color:#1a1a1a;">צוות <span style="color:#007A5E;font-weight:700;">Hiilo</span></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
  TextBody: `שלום ${name},

ה-eSIM שלך מוכן.

סרוק את הקוד או, אם אתה משתמש ב-iPhone, לחץ על הקישור להפעלה ישירה:
${esimDetails.activation.qr_code}

אם אתה משתמש ב-Android:
1. כנס להגדרות > רשת ניידת > הוסף eSIM ידנית
2. הזן את כתובת SM-DP+: ${esimDetails.activation.lpa_string}
3. הזן קוד הפעלה: ${esimDetails.activation.manual_activation_code}

צוות Hiilo מאחל לך חופשה לא פחות ממושלמת.`,
  MessageStream: "transactional",
  Attachments: [
    {
      Name: "logo-header.svg",
      Content: fs
        .readFileSync("C:\\Users\\gersh\\esim-go\\frontend\\apps\\web-app\\public\\images\\logos\\logo-header.svg")
        .toString("base64"),
      ContentID: "logo-header.svg",
      ContentType: "image/svg+xml",
    },
  ],
});

console.log("✅ נשלח מייל בדיקה בהצלחה ל-" + email);
