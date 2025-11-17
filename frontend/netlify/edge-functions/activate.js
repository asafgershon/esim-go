export default async (request, context) => {
  const url = new URL(request.url);
  const raw = url.searchParams.get("lpa");

  if (!raw) {
    return new Response("Missing 'lpa' parameter", { status: 400 });
  }

  // מפענחים (חשוב!)
  const lpa = decodeURIComponent(raw);

  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>הפעלת eSIM</title>
</head>
<body style="
  font-family: sans-serif;
  padding: 40px;
  text-align: center;
  background: #f5f5f5;
">

  <h2>התקנת ה-eSIM</h2>
  <p>לחצו על הכפתור כדי להתחיל את ההתקנה:</p>

  <a id="installButton"
     href="${lpa}"
     style="
        display: inline-block;
        padding: 18px 28px;
        background: #4a5be3;
        color: white;
        font-size: 20px;
        font-weight: bold;
        border-radius: 12px;
        text-decoration: none;
        margin-top: 20px;
     ">
    הפעל eSIM
  </a>

  <p style="margin-top:30px; font-size:13px; color:#444;">
    אם לא נפתח מסך התקנה, יש לפתוח את העמוד בספארי (Safari).
  </p>

</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const config = { path: "/activate" };
