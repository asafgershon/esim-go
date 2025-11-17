export default async (request, context) => {
  const url = new URL(request.url);
  const lpa = url.searchParams.get("lpa");

  if (!lpa) {
    return new Response("Missing 'lpa' parameter", { status: 400 });
  }

  // נעשה redirect אל ה־LPA האמיתי
  return Response.redirect(lpa, 302);
};

export const config = {
  path: "/activate",
};
