export default async (request, context) => {
  const url = new URL(request.url);
  const raw = url.searchParams.get("lpa") || "";
  
  // מפענחים
  const decoded = decodeURIComponent(raw);

  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <title>בדיקת LPA</title>
  </head>
  <body style="font-family: sans-serif; padding: 40px;">
    <h2>🔍 בדיקת פענוח LPA</h2>

    <p><strong>Raw (מה הגיע ב-URL):</strong></p>
    <pre style="background:#eee; padding:10px; border-radius:6px;">${raw}</pre>

    <p><strong>Decoded (אחרי decodeURIComponent):</strong></p>
    <pre style="background:#eee; padding:10px; border-radius:6px;">${decoded}</pre>

    <p><strong>תווים בודדים:</strong></p>
    <ul>
      <li>כולל ":" ? → ${decoded.includes(":")}</li>
      <li>כולל "$" ? → ${decoded.includes("$")}</li>
      <li>כולל "LPA:" ? → ${decoded.startsWith("LPA:")}</li>
    </ul>

    <hr />
    <p>שום דבר לא מופעל כאן — זה רק פענוח.</p>
  </body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const config = { path: "/debug-lpa" };
