import postmark from "postmark";

// יצירת לקוח Postmark
const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN!);

export async function sendCustomerEmail({
  to,
  name,
  amount,
  orderId,
}: {
  to: string;
  name?: string;
  amount?: number;
  orderId?: string;
}) {
  try {
    const result = await client.sendEmail({
      From: "office@hiiloworld.com", // הכתובת שאישרת ב-Postmark
      To: to,
      Subject: "התשלום שלך אושר 🎉",
      HtmlBody: `
        <h2>שלום${name ? ` ${name}` : ""},</h2>
        <p>תודה על הרכישה שלך!</p>
        <p>התשלום שלך על סך ${amount ?? "?"} ₪ אושר בהצלחה.</p>
        <p>מספר הזמנה: <strong>${orderId ?? "-"}</strong></p>
        <br/>
        <p>המוצר שלך יישלח בהמשך למייל זה. תודה שבחרת ב-Hiilo!</p>
      `,
      TextBody: `שלום ${name || ""}, התשלום שלך אושר בהצלחה.`,
      MessageStream: "transactional",
    });

    console.log("✅ Email sent via Postmark:", result.MessageID);
  } catch (error) {
    console.error("❌ Failed to send email via Postmark:", error);
  }
}
