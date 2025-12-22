import axios from "axios";
import postmark from "postmark";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

// ⚙️ הגדרות בסיסיות – תמלא פה
const MAYA_USERNAME = "y5b7HUu2PkCK";
const MAYA_PASSWORD = "BcM1pD9MhpY5eZNunPJqRCEQGIyDbmmceIw69bszr7xQT6KLqvVvj4kFo8Xz1SuH";
const MAYA_BASE_URL = "https://api.maya.net/connectivity/v1";
const ICCID = "8910300000046944851";

const POSTMARK_TOKEN = "eb7e4a97-3d71-4c8e-8bd0-f2c85fafaa28";
const RECIPIENT_EMAIL = "amitutish@gmail.com";
const RECIPIENT_NAME = "amit";

// 📁 תקייה שבה יושבים נכסי האימייל (אותם קבצים שאתה כבר משתמש בהם בשרת)
const EMAIL_ASSETS_DIR = path.join(__dirname, "email-assets");

// קורא קובץ ומחזיר Base64 (כמו אצלך בשרת)
function readEmailAsset(fileName: string): string {
  const fullPath = path.join(EMAIL_ASSETS_DIR, fileName);
  const buff = fs.readFileSync(fullPath);
  return buff.toString("base64");
}

function loadFileAsBase64(fullPath: string) {
  return fs.readFileSync(fullPath).toString("base64");
}


// 🟢 יצירת לקוח Postmark
const postmarkClient = new postmark.ServerClient(POSTMARK_TOKEN);

// 🌐 שליפת מידע על eSIM מ-Maya API
async function getEsimData(iccid: string) {
  const response = await axios.get(`${MAYA_BASE_URL}/esim/${iccid}`, {
    auth: {
      username: MAYA_USERNAME,
      password: MAYA_PASSWORD,
    },
  });

  if (!response.data || !response.data.esim) {
    throw new Error("Maya response does not contain 'esim' object");
  }

  return response.data.esim as {
    uid: string;
    iccid: string;
    activation_code: string;
    manual_code: string;
    smdp_address: string;
    auto_apn?: number;
    apn?: string;
    state?: string;
    service_status?: string;
    network_status?: string;
    tag?: string;
    date_assigned?: string;
  };
}

// ✉️ שליחת מייל עם פרטי ה-eSIM
async function sendEsimEmail() {
  // 1. שליפת ה-eSIM מ-Maya
  const esim = await getEsimData(ICCID);

  const activationString = esim.activation_code;   // ה-LPA
  const lpaString = esim.smdp_address;             // כתובת SM-DP+
  const manualCode = esim.manual_code;             // קוד הפעלה ידני
  const pseudoOrderId = `ESIM-${esim.iccid}`;      // "מספר הזמנה" דמיוני רק לתצוגה במייל

  // 2. יצירת QR כ-base64
  const qrImageBase64 = (await QRCode.toDataURL(activationString, { width: 250 }))
    .replace(/^data:image\/png;base64,/, "");

  console.log("activation_code:", esim.activation_code);

  // 3. שליחת המייל
  await postmarkClient.sendEmail({
    From: "HiiloWorld office@hiiloworld.com",
    To: RECIPIENT_EMAIL,
    Subject: "ה-eSIM שלך מוכן",
    HtmlBody: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
  /* מנטרל החלפת צבעים ב־dark mode */
  @media (prefers-color-scheme: dark) {
  
  /* Footer dark */
 .footer-main {
    background:#0B1E25 !important; /* כחול-כהה שמתאים לכהה */
    color:#E9EEF2 !important;       /* טקסט בהיר */
  }

  .footer-sub {
    background:#00C98D !important; /* ירוק רגוע יותר לכהה */
    color:#000000 !important;      /* טקסט שחור */
  }

  .footer-link {
    color:#000000 !important;      /* לינק יישאר קריא */
  }
    body, table, td, div, p, span {
      background-color: #ffffff !important;
      color: #000000 !important;
    }

    /* אל תיתן ל־Gmail/Apple Mail להפוך לינקים לכחול בהיר */
    a {
      color: #0a84ff !important;
    }
  }
</style>
  <title>ה-eSIM שלך מוכן</title>
</head>

<body data-ogsc="light" style="margin:0; padding:0; background-color:#f5f5f7 !important;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
             direction:rtl; text-align:right;">

  <div class="light-mode" style="background-color:#f5f5f7 !important;">

  <table role="presentation" style="width:100%; border-collapse:collapse;
         background-color:#f5f5f7 !important; padding:40px 20px;">
    <tr>
      <td align="center">

        <table role="presentation" style="max-width:600px; width:100%;
               background:#ffffff !important; border-radius:16px;
               box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:0; margin:0;">
              <img src="cid:header.png"
                   alt="Hiilo Header"
                   style="display:block; width:100%; height:auto; filter:invert(0) !important;" />
            </td>
          </tr>

          <!-- Greeting Section -->
          <tr>
            <td style="background:#ffffff !important; padding:25px 30px 10px; margin:0;">
              <table role="presentation" style="width:100%; border-collapse:collapse;">
                <tr>

                  <!-- RIGHT — Text -->
                  <td style="width:65%; vertical-align:middle; text-align:right;">

                    <p style="margin:0; font-size:16px; color:#000; font-weight:600;">
                      שלום ${RECIPIENT_NAME},
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

                  <!-- LEFT — Beach Image -->
                  <td style="width:35%; vertical-align:bottom; text-align:left;">
                    <img src="cid:beach.svg"
                         alt="Beach Illustration"
                         style="width:90%; height:auto; display:block; margin-top:35px; filter:invert(0) !important;" />
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- Order ID Box (פשוט משתמשים ב-ICCID בתור "מספר הזמנה") -->
          <tr>
            <td style="background:#ffffff !important; padding:5px 30px 20px;">
              <table role="presentation"
                     style="width:100%; background:#5565ef; border-radius:10px; padding:12px 18px;">
                <tr>
                  <td style="text-align:center;">
                    <span style="color:#ffffff; font-size:14px; font-weight:600;
                                 white-space:nowrap; display:inline-block;">
                      מספר ההזמנה שלך: ${pseudoOrderId}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR BOX -->
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
                         style="width:200px; height:200px; display:block; margin:0 auto; filter:invert(0) !important;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- iPhone Installation -->
          <tr>
            <td style="padding:0 30px 20px;">

              <table role="presentation" style="
                width:100%;
                background:#f1f4f9;
                border-radius:16px;
                padding:24px 18px;
                text-align:center;
                margin-bottom:20px;
              ">
                <tr>
                  <td style="font-size:16px; font-weight:700; color:#4a5be3; padding-bottom:16px;">
                    להתקנה בקליק ב-iPhone
                  </td>
                </tr>

                <tr>
                  <td>
                    <table role="presentation" style="
                      width:100%;
                      max-width:480px;
                      background:white;
                      border-radius:14px;
                      padding:20px;
                      margin:0 auto;
                    ">
                      <tr>
                        <td style="text-align:center;">

                          <a href="https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${activationString}"
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

          <!-- Android Installation -->
          <tr>
            <td style="padding:0 30px 20px;">

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
                      margin:0:auto;
                      text-align:right;
                    ">

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

                      <tr>
                        <td style="
                          font-size:14px;
                          color:#000;
                          line-height:1.6;
                        ">
                          כנסו להגדרות &gt; רשת ניידת &gt; הוסף eSIM ידנית
                        </td>
                      </tr>

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

                        <tr>
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
                              ${lpaString}
                            </div>
                          </td>
                        </tr>

                        <tr>
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
                              ${manualCode}
                            </div>
                          </td>
                        </tr>

                      </table>

                    </table>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0; margin:0;">
<table role="presentation" class="footer-main"
  style="width:100%; background:#06202B; padding:32px 20px 40px;
  border-radius:20px 20px 0 0; text-align:center; color:#ffffff;">
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

                <tr>
                  <td>
                    <a href="https://wa.me/972000000000"
                       style="
                         display:inline-flex;
                         align-items:center;
                         gap:8px;
                         background:#ffffff !important;
                         color:#000000;
                         padding:10px 22px;
                         border-radius:10px;
                         text-decoration:none;
                         font-size:15px;
                         font-weight:600;
                       ">
                      לשליחת הודעה
                    </a>
                  </td>
                </tr>
              </table>

<table role="presentation" class="footer-sub"
  style="width:100%; background:#00EBA7; padding:20px 10px; text-align:center;">
                <tr>
                  <td style="font-size:15px; font-weight:600;">
                    נשמח שתשלחו לנו משוב:
<a class="footer-link"
  href="mailto:office@hiiloworld.com"
  style="color:#000; text-decoration:underline;">
                      office@hiiloworld.com
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</div>
</body>
</html>
    `,

    TextBody: `שלום ${RECIPIENT_NAME},

ה-eSIM שלך מוכן.

סרוק את הקוד המצורף או, אם אתה משתמש ב-iPhone,
הפעל ישירות מהקישור הבא: ${activationString}

אם אתה משתמש ב-Android:
1. כנס להגדרות › רשת ניידת › הוסף eSIM ידנית
2. הזן כתובת SM-DP+: ${lpaString}
3. הזן קוד הפעלה: ${manualCode}

צוות Hiilo מאחל לך חופשה מושלמת.`,
    MessageStream: "transactional",
    Attachments: [
      {
        Name: "header_hiilo_esim.png",
        Content: loadFileAsBase64("C:\\Users\\gersh\\esim-go\\backend\\server\\assets\\email\\header_hiilo_esim.png"),
        ContentID: "header.png",
        ContentType: "image/png",
      },
      {
        Name: "beach.svg",
        Content: loadFileAsBase64("C:\\Users\\gersh\\esim-go\\backend\\server\\assets\\email\\beach.svg"),
        ContentID: "beach.svg",
        ContentType: "image/svg+xml",
      },
      {
        Name: "palm.svg",
        Content: loadFileAsBase64("C:\\Users\\gersh\\esim-go\\backend\\server\\assets\\email\\palm.svg"),
        ContentID: "palm.svg",
        ContentType: "image/svg+xml",
      },
      {
        Name: "qrcode.png",
        Content: qrImageBase64,
        ContentID: "qrcode.png",
        ContentType: "image/png",
      },
    ],
  });

  console.log("✅ Email sent to", RECIPIENT_EMAIL);
}

// להרצה ישירה של הקובץ
sendEsimEmail().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
