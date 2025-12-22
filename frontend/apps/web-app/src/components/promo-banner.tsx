"use client";

export function PromoBanner() {
  return (
    <section className="py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="
            bg-brand-dark 
            rounded-2xl md:rounded-3xl 
            py-4 md:py-5 
            px-6 md:px-8 
            text-center
          ">
<p
  className="
    text-white
    text-sm md:text-base lg:text-lg
    font-birzia
    leading-relaxed
  "
>
  <span>
    המערכת של Hiilo סורקת בזמן אמת את כל ספקי הגלישה הרלוונטיים ביעד אליו אתם טסים,
  </span>{" "}
  <span className="text-brand-green font-semibold">
    ומביאה לכם את הדיל המשתלם ביותר.
  </span>
</p>
          </div>
        </div>
      </div>
    </section>
  );
}