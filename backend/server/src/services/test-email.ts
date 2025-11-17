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
const postmarkClient = new postmark.ServerClient("");
const headerImageBase64 = fs.readFileSync("C:\\Users\\gersh\\esim-go\\frontend\\apps\\web-app\\public\\images\\email\\header_hiilo_esim.png", "base64");

await postmarkClient.sendEmail({
  From: "office@hiiloworld.com",
  To: email,
  Subject: "ה-eSIM שלך מוכן",
  HtmlBody: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ה-eSIM שלך מוכן</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f7;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
             direction:rtl; text-align:right;">

  <table role="presentation" style="width:100%; border-collapse:collapse;
         background-color:#f5f5f7; padding:40px 20px;">
    <tr>
      <td align="center">

        <table role="presentation" style="max-width:600px; width:100%;
               background:#ffffff; border-radius:16px;
               box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:0; margin:0;">
              <img src="cid:header.png"
                   alt="Hiilo Header"
                   style="display:block; width:100%; height:auto;" />
            </td>
          </tr>

          <!-- Greeting Section - FIXED: Text RIGHT, Beach LEFT -->
          <tr>
            <td style="background:#ffffff; padding:25px 30px 10px; margin:0;">
              <table role="presentation" style="width:100%; border-collapse:collapse;">
                <tr>

                  <!-- RIGHT — Text (switched from left) -->
                  <td style="width:65%; vertical-align:middle; text-align:right;">

                    <p style="margin:0; font-size:16px; color:#000; font-weight:600;">
                      שלום ${name},
                    </p>

                    <p style="margin:12px 0 0; font-size:13px; color:#000; line-height:1.6;">
                      שתהיה לך חופשה מושלמת,
                    </p>

                    <p style="margin:2px 0 0; font-size:13px; color:#000; line-height:1.6;">
                      וכמובן אם צריך אותי אני כאן!
                    </p>

                    <p style="margin:12px 0 0; font-size:12px; color:#3f51ff; font-weight:600;">
                      - אסף, מנהל קשרי לקוחות
                    </p>

                  </td>

                  <!-- LEFT — Beach Image (switched from right) -->
                  <td style="width:35%; vertical-align:bottom; text-align:left;">
                    <img src="cid:beach.svg"
                         alt="Beach Illustration"
                         style="width:90%; height:auto; display:block; margin-top:35px;" />
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- Order ID Box -->
          <tr>
            <td style="background:#ffffff; padding:5px 30px 20px;">
              <table role="presentation"
                     style="width:100%; background:#5565ef; border-radius:10px; padding:12px 18px;">
                <tr>
                  <td style="text-align:center;">
                    <span style="color:#ffffff; font-size:14px; font-weight:600;
                                 white-space:nowrap; display:inline-block;">
                      מספר ההזמנה שלך: ${order.id}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR BOX (NO PALMS, CENTERED) -->
<tr>
  <td style="padding:0 30px 30px; text-align:center;">
    <table role="presentation"
           style="width:100%; max-width:300px; margin:0 auto;
                  background:#e3e8fb; border:2px solid #b8c1e8;
                  border-radius:16px; padding:30px;">
      <tr>
        <td style="text-align:center;">
          <img src="cid:qrcode.png"
               alt="QR Code"
               style="width:200px; height:200px; display:block; margin:0 auto;" />
        </td>
      </tr>
    </table>
  </td>
</tr>
          <!-- iPhone Installation Block -->
<tr>
  <td style="padding:0 30px 20px;">

    <table role="presentation" style="
      width:100%;
      background:#f1f4f9;
      border-radius:16px;
      padding:24px 18px;
      text-align:center;
      margin-bottom:20px; /* 🔥 מפריד את האפור מהאפור שמתחת */
    ">
      <tr>
        <td style="font-size:16px; font-weight:700; color:#4a5be3; padding-bottom:16px;">
          להתקנה בקליק ב-iPhone
        </td>
      </tr>

      <!-- Inner white box (same width for both blocks) -->
      <tr>
        <td>
          <table role="presentation" style="
            width:100%;
            max-width:480px;   /* 🔥 לבן אחיד ברוחב לאייפון ואנדרואיד */
            background:white;
            border-radius:14px;
            padding:20px;
            margin:0 auto;      /* 🔥 מרכז את הלבן */
          ">
            <tr>
              <td style="text-align:center;">

                <a href="aa"
                   style="
                     display:inline-flex;
                     align-items:center;
                     gap:6px;
                     padding:12px 28px;
                     border-radius:10px;
                     border:2px solid #4a5be3;
                     text-decoration:none;
                     font-size:16px;
                     font-weight:700;
                     color:#0a0a0a;
                     white-space:nowrap;
                   ">
                  <img src="cid:apple.png"
                       alt="Apple"
                       style="width:18px; height:auto;" />
                   הפעילו את ה-eSIM בלחיצה כאן
                </a>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

  </td>
</tr>

<!-- Android Installation Block -->
<tr>
  <td style="padding:0 30px 20px;">

    <!-- Outer grey background -->
    <table role="presentation" style="
      width:100%;
      background:#f1f4f9;
      border-radius:16px;
      padding:24px 18px;
      text-align:center;
    ">

      <!-- Blue title -->
      <tr>
        <td style="
          font-size:16px;
          font-weight:700;
          color:#4a5be3;
          padding-bottom:20px;
          text-align:center;
        ">
          להתקנה ידנית ב-Android עקבו אחר ההוראות:
        </td>
      </tr>

      <!-- Inner white card -->
      <tr>
        <td>
          <table role="presentation" style="
            width:100%;
            max-width:520px;
            background:white;
            border-radius:14px;
            padding:26px 22px;
            margin:0 auto;
            text-align:right;
          ">

            <!-- Subtitle -->
            <tr>
              <td style="
                font-size:16px;
                font-weight:700;
                color:#000;
                padding-bottom:6px;
              ">
                אם יש לכם Android
              </td>
            </tr>

            <!-- Basic instructions -->
            <tr>
              <td style="
                font-size:14px;
                color:#000;
                line-height:1.6;
              ">
                כנסו להגדרות &gt; רשת ניידת &gt; הוסף eSIM ידנית
              </td>
            </tr>

            <!-- "Excellent!" -->
            <tr>
              <td style="
                font-size:14px;
                color:#4a5be3;
                font-weight:700;
                padding-top:8px;
              ">
                נכנסתם? מעולה!
              </td>
            </tr>

            <!-- Explanation -->
            <tr>
              <td style="
                font-size:14px;
                color:#000;
                padding:6px 0 16px;
              ">
                העתיקו את הפרטים הבאים במדויק:
              </td>
            </tr>

<!-- SM-DP+ + Activation Code Table -->
<table role="presentation" style="width:100%; border-collapse:collapse; margin-top:4px;">

  <!-- Row 1 -->
  <tr>
    <!-- Label -->
    <td style="
      font-size:14px;
      font-weight:700;
      color:#000;
      padding:8px 0;
      text-align:right;
      white-space:nowrap;
      width:1%;
    ">
      כתובת SM-DP+:
    </td>

    <!-- Code box -->
<td style="padding:8px 0; text-align:right; width:220px;">
  <div style="
    background:#f5f7fb;
    border:1px solid #e0e4ef;
    border-radius:10px;
    padding:8px 10px;
    font-size:12px;
    color:#000;
    white-space:nowrap;
    text-align:center;
    width:100%;
    display:block;
  ">
    ${esimDetails.activation.lpa_string}
  </div>
</td>
  </tr>

  <!-- Row 2 -->
  <tr>
    <!-- Label -->
    <td style="
      font-size:14px;
      font-weight:700;
      color:#000;
      padding:8px 0;
      text-align:right;
      white-space:nowrap;
      width:1%;
    ">
      קוד הפעלה:
    </td>

    <!-- Code box -->
<td style="padding:8px 0; text-align:right; width:220px;">
  <div style="
    background:#f5f7fb;
    border:1px solid #e0e4ef;
    border-radius:10px;
    padding:8px 10px;
    font-size:12px;
    color:#000;
    white-space:nowrap;
    text-align:center;
    width:100%;
    display:block;
  ">
    ${esimDetails.activation.manual_activation_code}
  </div>
</td>
  </tr>

</table>


              </td>
            </tr>

          </table>
        </td>
      </tr>

    </table>

  </td>
</tr>
<!-- Footer (Hiilo Support + Email) -->
<tr>
  <td style="padding:0; margin:0;">

    <!-- Dark blue box -->
    <table role="presentation" style="
      width:100%;
      background:#06202B;
      border-radius:20px 20px 0 0;
      padding:32px 20px 40px;
      text-align:center;
    ">
      <tr>
        <td style="font-size:20px; font-weight:700; color:#ffffff; padding-bottom:6px;">
          עדיין צריכים עזרה?
        </td>
      </tr>

      <tr>
        <td style="font-size:14px; color:#d5e0e5; padding-bottom:20px;">
          לשליחת הודעת וואטסאפ לשירות הלקוחות
        </td>
      </tr>

      <!-- WhatsApp button -->
      <tr>
        <td>
          <a href="https://wa.me/972000000000"
             style="
               display:inline-flex;
               align-items:center;
               gap:8px;
               background:#ffffff;
               color:#000000;
               padding:10px 22px;
               border-radius:10px;
               text-decoration:none;
               font-size:15px;
               font-weight:600;
             ">
            <img src="cid:whatsapp.png"
                 alt="WhatsApp"
                 style="width:18px; height:auto;" />
            לשליחת הודעה
          </a>
        </td>
      </tr>
    </table>

    <!-- Green band -->
    <table role="presentation" style="
      width:100%;
      background:#00EBA7;
      padding:20px 10px;
      text-align:center;
    ">
      <tr>
        <td style="font-size:15px; color:#000; font-weight:600;">
          נשמח שתשלחו לנו משוב: 
          <a href="mailto:office@hiiloworld.com"
             style="color:#000; text-decoration:underline;">
            office@hiiloworld.com
          </a>
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

סרוק את הקוד המצורף או, אם אתה משתמש ב-iPhone,
הפעל ישירות מהקישור הבא:aa

אם אתה משתמש ב-Android:
1. כנס להגדרות › רשת ניידת › הוסף eSIM ידנית
2. הזן כתובת SM-DP+: aa
3. הזן קוד הפעלה: aa

צוות Hiilo מאחל לך חופשה מושלמת.`,
  
  MessageStream: "transactional",

  Attachments: [
    {
      Name: "header.png",
      Content: headerImageBase64,
      ContentID: "header.png",
      ContentType: "image/png",
    },
    {
      Name: "beach.svg",
      Content: fs.readFileSync("C:\\Users\\gersh\\esim-go\\frontend\\apps\\web-app\\public\\images\\email\\beach.svg", "base64"),
      ContentID: "beach.svg",
      ContentType: "image/svg+xml",
    },
    {
    Name: "palm.svg",
    Content: fs.readFileSync("C:\\Users\\gersh\\esim-go\\frontend\\apps\\web-app\\public\\images\\email\\palm.svg", "base64"),
    ContentID: "palm.svg",
    ContentType: "image/svg+xml",
    },
    {
  Name: "apple.png",
  Content: fs.readFileSync("C:\\Users\\gersh\\esim-go\\frontend\\apps\\web-app\\public\\images\\email\\apple.png", "base64"),
  ContentID: "apple.png",
  ContentType: "image/png",
  },
  {
  Name: "whatsapp.png",
  Content: fs.readFileSync("C:\\Users\\gersh\\esim-go\\frontend\\apps\\web-app\\public\\images\\email\\whatsapp.png", "base64"),
  ContentID: "whatsapp.png",
  ContentType: "image/png",
}
  ],
});


console.log("✅ נשלח מייל בדיקה בהצלחה ל-" + email);
