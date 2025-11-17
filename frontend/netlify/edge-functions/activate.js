export default async (request, context) => {
  const url = new URL(request.url);
  const lpa = url.searchParams.get("lpa");

  if (!lpa) {
    return new Response("Missing 'lpa' parameter", { status: 400 });
  }

  // 🔥 מפענחים כדי לקבל LPA אמיתי (לא מקודד)
  const decoded = decodeURIComponent(lpa);

  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <title>מתקין eSIM…</title>
  </head>
  <body style="font-family: sans-serif; padding: 40px; text-align: center;">
    <h2>מתקין את ה-eSIM…</h2>
    <p>אם זה לא נפתח אוטומטית, לחץ כאן:</p>

    <!-- ✔ הקישור עצמו מכיל LPA אמיתי -->
    <a href="${decoded}" style="font-size: 22px; font-weight: bold;">הפעל eSIM</a>

    <script>
      // ✔ מנסה לפתוח את LPA הטהור
      window.location.href = "${decoded}";
    </script>
  </body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const config = { path: "/activate" };
