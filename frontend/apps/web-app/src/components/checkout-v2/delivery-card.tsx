"use client";

import { gql, useMutation, type ApolloError, type FetchResult } from "@apollo/client";
import {
  Checkout,
  UpdateCheckoutDeliveryMutation,
  UpdateCheckoutDeliveryMutationVariables,
  TriggerCheckoutPaymentMutation,
  TriggerCheckoutPaymentMutationVariables,
} from "@/__generated__/graphql";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
} from "@workspace/ui";
import { Package, Loader2 } from "lucide-react";
import { SectionHeader } from "./section-header";

type DeliveryCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "delivery" | "id"> | undefined;
  onDeliveryUpdateAction: (delivery: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    completed?: boolean | null;
  }) => void;
  loading: boolean;
  triggerPayment: (
    options: { variables: TriggerCheckoutPaymentMutationVariables }
  ) => Promise<FetchResult<TriggerCheckoutPaymentMutation>>;
  isPaymentLoading: boolean;
  paymentError?: ApolloError | undefined;
};

const phoneRegex = /^(?:\+972|0)(?:-)?(?:5[0-9])(?:-)?(?:[0-9]{7})$/;
const DeliverySchema = z
  .object({
    firstName: z.string().min(2, { message: "שם פרטי חייב להכיל לפחות 2 תווים" }),
    lastName: z.string().min(2, { message: "שם משפחה חייב להכיל לפחות 2 תווים" }),
    phone: z.string().regex(phoneRegex, { message: "מספר טלפון לא תקין" }),
    email: z.string().email({ message: "אימייל לא תקין" }),
    confirmEmail: z.string().email({ message: "אימייל לא תקין" }),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "האימיילים אינם תואמים",
    path: ["confirmEmail"],
  });
type DeliveryFormData = z.infer<typeof DeliverySchema>;

const UPDATE_CHECKOUT_DELIVERY_MUTATION = gql(`
  mutation UpdateCheckoutDelivery(
    $sessionId: String!,
    $email: String,
    $firstName: String,
    $lastName: String,
    $phone: String
  ) {
    updateCheckoutDelivery(
      sessionId: $sessionId,
      email: $email,
      firstName: $firstName,
      lastName: $lastName,
      phone: $phone
    ) {
      email
      firstName
      lastName
      phone
      completed
    }
  }
`);

export const DeliveryCard = ({
  sectionNumber,
  data,
  completed,
  loading,
  onDeliveryUpdateAction,
  triggerPayment,
  isPaymentLoading,
  paymentError,
}: DeliveryCardProps) => {
  const { delivery } = data || {};
  const [showTerms, setShowTerms] = useState(false);

  const [updateCheckoutDelivery, { loading: isSavingDelivery }] = useMutation<
    UpdateCheckoutDeliveryMutation,
    UpdateCheckoutDeliveryMutationVariables
  >(UPDATE_CHECKOUT_DELIVERY_MUTATION);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid: isFormValid },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(DeliverySchema),
    defaultValues: {
      firstName: delivery?.firstName || "",
      lastName: delivery?.lastName || "",
      phone: delivery?.phone || "",
      email: delivery?.email || "",
      confirmEmail: delivery?.email || "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    async (formData: DeliveryFormData) => {
      if (!data?.id) return;
      const cleanedEmail = formData.email.trim();
      const cleanedFirstName = formData.firstName.trim();
      const cleanedLastName = formData.lastName.trim();
      const cleanedPhone = formData.phone.trim();

      try {
        const { data: result } = await updateCheckoutDelivery({
          variables: {
            sessionId: data.id,
            email: cleanedEmail,
            firstName: cleanedFirstName,
            lastName: cleanedLastName,
            phone: cleanedPhone,
          },
        });

        if (result?.updateCheckoutDelivery) {
          onDeliveryUpdateAction(result.updateCheckoutDelivery);
          reset({
            email: cleanedEmail,
            confirmEmail: cleanedEmail,
            firstName: cleanedFirstName,
            lastName: cleanedLastName,
            phone: cleanedPhone,
          });

          const paymentRes = await triggerPayment({
            variables: {
              sessionId: data.id,
              nameForBilling: `${cleanedFirstName} ${cleanedLastName}`,
              redirectUrl: "https://hiiloworld.com/",
            },
          });

          const intentUrl = paymentRes.data?.triggerCheckoutPayment?.intent?.url;
          if (intentUrl) window.location.href = intentUrl;
        }
      } catch (err) {
        console.error("[DeliveryCard] Error:", err);
      }
    },
    [data?.id, updateCheckoutDelivery, onDeliveryUpdateAction, reset, triggerPayment]
  );

  const getButtonLabel = () => {
    if (loading) return "טוען נתונים...";
    if (isSavingDelivery)
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> שומר פרטים...
        </>
      );
    if (isPaymentLoading)
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> מעביר לתשלום...
        </>
      );
    return "שמור והמשך לתשלום";
  };

  const isButtonDisabled =
    loading ||
    isSavingDelivery ||
    isPaymentLoading ||
    (!isDirty && !completed) ||
    (isDirty && !isFormValid);

  if (loading && !data) return <DeliveryCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full text-right">
          <SectionHeader
            className="mb-4"
            sectionNumber={sectionNumber || 3}
            title="פרטי משלוח"
            icon={<Package className="h-5 w-5 text-primary" />}
            isCompleted={completed}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">שם פרטי</Label>
                  <Input
                    id="firstName"
                    placeholder="ישראל"
                    {...register("firstName")}
                    disabled={loading || isSavingDelivery || isPaymentLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">שם משפחה</Label>
                  <Input
                    id="lastName"
                    placeholder="ישראלי"
                    {...register("lastName")}
                    disabled={loading || isSavingDelivery || isPaymentLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">טלפון נייד</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="05X-XXXXXXX"
                  {...register("phone")}
                  disabled={loading || isSavingDelivery || isPaymentLoading}
                  dir="ltr"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="israel@hiiloworld.com"
                  {...register("email")}
                  disabled={loading || isSavingDelivery || isPaymentLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmEmail">אישור אימייל</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  placeholder="הקלד שוב את האימייל"
                  {...register("confirmEmail")}
                  autoComplete="off"
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  disabled={loading || isSavingDelivery || isPaymentLoading}
                />
                {errors.confirmEmail && (
                  <p className="text-sm text-red-500">
                    {errors.confirmEmail.message}
                  </p>
                )}
              </div>

              {/* 💬 כפתור תנאי שימוש */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600 leading-relaxed">
                  בלחיצה על <strong>שמור והמשך לתשלום</strong> אתה מאשר את{" "}
                  <button
                    type="button"
                    className="font-bold underline text-gray-800 hover:text-gray-900"
                    onClick={() => setShowTerms(true)}
                  >
                    תנאי השימוש והרכישה באתר
                  </button>
                </p>

                {showTerms && (
                  <div
                    dir="rtl"
                    className="p-4 mt-4 border rounded-md bg-gray-50 text-sm text-gray-800 max-h-[60vh] overflow-y-auto space-y-3 leading-relaxed"
                  >
                    <h3 className="text-xl font-semibold mb-2">תנאי שימוש</h3>
<p>
            ברוכים הבאים לאתר Hiiloworld. האתר מספק שירותים המיועדים לתמוך בצורכי תקשורת של תיירים במהלך
            שהותם בחו&quot;ל. השימוש באתר ובשירותים הניתנים בו כפוף לתנאים המפורטים להלן.
          </p>
          <p>
            תנאים אלה מהווים הסכם מחייב בינך לבין מפעילת האתר, קבוצת Hiiloworld, ויחולו על כל שימוש שתעשה באתר
            ובשירותים המוצעים בו. אם אינך מסכים לתנאים אלה – אל תשתמש באתר. תנאים אלו מנוסחים בלשון זכר מטעמי
            נוחות בלבד, אך מתייחסים באופן שווה לכל המגדרים.
          </p>
          <p>
            זהות הספק ושירותי האתר – האתר מופעל על-ידי קבוצת Hiiloworld, אשר פועלת כמשווק מורשה וכספק משנה
            לרכישת חבילות eSIM מספקים בחו&quot;ל. החברה מספקת שירותי רכישת והפצת חבילות תקשורת סלולרית (Data
            Only) במדינות שונות, לרבות חבילות בעלות נפח גלישה מוגדת מראש בתצורת Fixed או חבילות הכוללת נפח
            גלישה בלתי מוגבל אלא מוגבלות בכמות ימי הגלישהUnlimited וזאת בהתאם למגבלות ספק השירות.
          </p>
          <p>
            בעת גלישה באתר ושימוש בשירותיו, אתה מצהיר ומתחייב כי הגלישה והשימוש באתר מבוצעים על אחריותך
            הבלעדית; כי כל הפרטים שמסרת בעת השארת פרטים, יצירת קשר, ביצוע רכישה או כל פעולה אחרת באתר הם נכונים,
            מדויקים, עדכניים ומלאים; כי במקרה של שינוי בפרטיך האישיים תעדכן את החברה באופן מיידי; כי הינך בעל
            כשירות משפטית להתקשר בתנאים אלה וכי אתה מסכים להם במלואם; כי לא תעשה כל שימוש באתר באמצעים אוטומטיים
            או לא אנושיים (לרבות BOT, סקריפט או תוכנה אחרת), אלא באמצעות ממשק המשתמש הרגיל של האתר בלבד; כי לא
            תעשה שימוש באתר לכל מטרה בלתי חוקית או בלתי מורשית; כן אתה מצהיר כי רכישת השירות נעשית לשימוש מחוץ
            לישראל בלבד, ולא תעשה בו כל שימוש בתחום מדינת ישראל, וכי לא תפר באמצעות שימושך באתר כל הוראת דין,
            רגולציה או תקנה החלה עליך לפי כל דין.
          </p>
          <p>
            האתר רשאי, למנוע מכל גולש שימוש באתר לפי שיקול דעתו המוחלט. מבלי לגרוע מהאמור לעיל, האתר רשאי לחסום
            גישתו אליו או חלקה אם בעת השארת פרטים באתר נמסרו במתכוון פרטים שגויים, לא עדכניים או לא מלאים.
          </p>
          <p>
            החברה מספקת את החבילות עבור ספקים חיצוניים (צד שלישי), ומספקת אותן כפי שהספקים בחו&quot;ל מספקים
            אותן, קרי בתצורת AS-IS למשתמשים. הלקוח מצהיר כי ברכישת החבילה הוא מבין שהחברה אינה מתחייבת לאיכות
            השירות, למהירות הגלישה בפועל או לזמינות הספקים המקומיים במדינת היעד. כמו כן, הלקוח מצהיר כי הוא מבין
            שהחברה אינה מפעילת תקשורת בעצמה אלא משווקת עבור ספק בינלאומי לבין לקוחות בלבד.
          </p>
          <p>
            למען הסר ספק, מובהר בזאת כי השירותים הניתנים באמצעות אתר זה, לרבות רכישת קודי eSIM, מיועדים לשימוש
            מחוץ לישראל בלבד, אינם כוללים כל רכיב תקשורת הניתן בישראל, ואינם מאפשרים גלישה סלולרית או שימוש
            כלשהו בשטח מדינת ישראל. החברה אינה מספקת שירותי תקשורת בישראל, אינה בעלת רישיון תקשורת בישראל, ואינה
            צד להסכם שירותי תקשורת בתחומי מדינת ישראל.
          </p>
          <p>
            רכישת השירותים נעשית לשם שימוש במדינת יעד מחוץ לישראל בלבד, ומקבל השירות מצהיר על כך בעת רכישת וביצוע
            ההזמנה.
          </p>
          <p>
            אחריות המשתמש לבדוק מראש תאימות המכשיר לשירות הניתן ופתיחה לנעילה. החברה אינה אחראית לתקלות הנובעות
            מחוסר תאימות/נעילת מפעיל. שים לב כי באפשרותך לבדוק את תאימות המכשיר באמצעות לחצן בדף הבית של אתר
            החברה.
          </p>
          <p>
            אנו מספקים ללקוחותינו חבילות מסוג חבילה ללא הגבלת נפח גלישה (Unlimited). חבילות אלה כוללות לפחות:
            גלישה בנפח 1 GB ביום במהירות מלאה – מהירות מלאה בהתאם לתשתיות במדינת היעד, ובהתאם לרשת המקומית
            המספקת את השירות בפועל. לאחר מכן, מהירות מואטת של עד 1.25 mbs. בכל תקופה של 24 שעות, יתרת ה־1GB
            במהירות מלאה תתאפס ותתחדש.
          </p>
          <p>
            מובהר כי במדינות יעד מסוימות עשויות להיות זמינות חבילות עם מכסה יומית גבוהה יותר; האמור לעיל משקף את
            החבילה הבסיסית ביותר שהחברה משווקת.
          </p>
          <p>
            שירות הלקוחות הניתן במסגרת אתר זה מוגבל למידע כללי על הפעלת השירות בלבד, ואינו כולל סיוע טכני במדינת
            ישראל. החברה אינה מספקת כל תמיכה או שירות תקשורת בתחום מדינת ישראל.
          </p>
          <p>
            רכישה ותשלום כל העסקאות מבוצעות באמצעות כרטיס אשראי או אמצעי תשלום מקוון. התשלום מתבצע במטבע שקלי או
            בדולר, לפי בחירת החברה, בהתאם לעסקה. החברה שומרת לעצמה את הזכות לשנות מחירים מעת לעת. המחירים המוצגים
            באתר כוללים מע&quot;מ במידת הצורך, בהתאם לדין.
          </p>
          <p>
            בתשלום המבוצע במטבע זר – לא ניתן לבצע עסקה בתשלומים, קרדיט או עסקה דחויה, ולא יחולו הטבות והנחות
            מועדונים. בחירה בתשלום במט&quot;ח נעשית באחריותך בלבד, ובהתאם למגבלות אלה.
          </p>
          <p>
            לאחר השלמת הרכישה ואישור התשלום, יישלח ללקוח קודeSIM (קודQR) באמצעות מסך סיום רכישה ו/או באמצעות הודעת
            דוא&quot;ל לכתובת שמסר בעת ההזמנה. מאחר ומדובר במוצר דיגיטלי – לא מתבצע משלוח פיזי. האספקה הינה
            מיידית, והלקוח אחראי להתקנה עצמאית של החבילה בהתאם להנחיות המפורטות באתר ו/או שיתקבלו עם משלוח הקוד.
          </p>
          <p>מדיניות ביטולים והחזרים בהתאם לחוק הגנת הצרכן, התשמ&quot;א-1981 כפי שיפורט להלן:</p>
          <p>
            שירותים ניתנים לביטול תוך 14 ימים ממועד הרכישה, ובלבד שהשירות טרם הופעל או סופק (לא נשלח קוד ו/או לא
            בוצעה פעולת התקנה). במקרה של ביטול שלא עקב פגם – ייגבו דמי ביטול של עד 5% ממחיר העסקה או 100 ש&quot;ח –
            הנמוך מביניהם.
          </p>
          <p>במקרה של פגם בשירות (למשל אם לא סופק כלל) – יינתן החזר מלא.</p>
          <p>
            החברה אינה אחראית לכל נזק, ישיר או עקיף, שייגרם כתוצאה מהשירותים הניתנים. השירותים ניתנים AS IS על ידי
            ספק חיצוני, ואין באמור התחייבות לזמינות רציפה, מהירות או איכות של הגלישה. האחריות על השימוש בשירותים
            חלה על הלקוח בלבד. החברה אינה אחראית לכל תקלה, הפרעה או אי-זמינות שמקורה בצדדים שלישיים, לרבות ספקי
            התקשורת במדינת היעד.
          </p>
          <p>
            החברה שומרת ועושה מאמצים סבירים בהתאם למקובל בשוק לאבטחת הנתונים הנמסרים על-ידך, אך אינה יכולה להתחייב
            לכך באופן מוחלט. המשתמש מתחייב שלא לבצע כל פעולה לשיבוש, חדירה או השגת מידע שלא כדין ממאגרי המידע של
            האתר. פרטי התשלום אינם נשמרים בשרתי החברה.
          </p>
          <p>
            כל זכויות היוצרים, סימני המסחר, הקוד, הטקסטים, העיצוב, התמונות וכל תוכן אחר – שמורות לחברה ואין להעתיק,
            להפיץ, לשכפל או לעשות בהם שימוש כלשהו ללא אישור מראש ובכתב מהחברה. התמונות והגרפיקה באתר הן לצורכי
            המחשה בלבד.
          </p>
          <p>
            גולש שהשאיר פרטים באתר ומצורף לרשימת הדיוור של האתר מאשר שימוש בפרטיו לצורך קבלת מידע שיווקי, עדכונים
            ופרסומות שיבצע האתר מעת לעת, וזאת בהתאם להוראות הדיוור המפורטות בתקנון. אין להשאיר פרטים של אדם אחר
            באתר שלא בהסכמתו ו/או שלא בנוכחותו מול המסך בעת מילוי הפרטים, ולאחר שהוסברו לו תנאי התקנון. בעת מילוי
            הטופס יתבקש הגולש למסור פרטים אישיים כגון שם פרטי, שם משפחה, טלפון וכתובת דוא&quot;ל פעילה – לפי שיקול
            דעת האתר. מסירת פרטים חלקיים או שגויים עלולה למנוע שימוש תקין באתר ולסכל אפשרות ליצירת קשר. במקרה של
            שינוי פרטים, יש לעדכנם בפנייה יזומה. מובהר כי אין חובה חוקית למסור את הפרטים, אך ללא מסירתם לא תתאפשר
            קבלת עדכונים ותכנים שיווקיים. האתר יפעל בהתאם למדיניות הפרטיות שלו, ומהווה זו חלק בלתי נפרד מהתקנון.
            השארת פרטים ואישור קבלת תוכן שיווקי כוללים בין היתר מידע על מבצעים, הטבות ועדכונים למשתמשים רשומים,
            ומהווים הסכמה למשלוח דברי פרסומת לפי חוק התקשורת (בזק ושידורים) (תיקון מס’ 40), התשס&quot;ח – 2008.
            המשתמש רשאי להסיר את עצמו בכל עת מרשימת הדיוור באמצעות קישור ייעודי בתחתית כל הודעה או בפנייה יזומה
            לאתר, וכל עוד לא עשה כן, רשאי האתר להמשיך ולשלוח לו דיוור בהתאם לחוק. מובהר כי האתר רשאי, לפי שיקול
            דעתו הבלעדי, לבטל את רישומו של גולש מרשימת הדיוור בכל עת.
          </p>
          <p>
            האתר עשוי להכיל קישורים לאתרים חיצוניים שאינם בבעלות או בשליטת החברה, וכן עשוי להציג, לכלול או לעשות
            שימוש בתכנים שמקורם בצדדים שלישיים – לרבות טקסטים, תמונות, סרטונים, עיצובים, אפליקציות, תוכנות, קבצי
            מדיה, או כל תוכן אחר (&quot;תוכן צד שלישי&quot;). מובהר כי החברה אינה אחראית לתוכן צד שלישי, ואינה
            מבצעת כל בדיקה, בקרה או ניטור של אתרים או תכנים כאמור. כל שימוש, גישה או הסתמכות על אתרי צד שלישי או על
            תוכן שמקורו בצדדים שלישיים נעשה על אחריות המשתמש בלבד. החברה אינה מאשרת, תומכת, מתחייבת או נושאת
            באחריות כלשהי לאתרים, לשירותים, או למידע שמקורם בצדדים שלישיים, לרבות מדיניות פרטיות, תנאי שימוש, תוכן
            מסחרי או בטיחות מידע.
          </p>
          <p>
            רכישות, עסקאות או התקשרויות אחרות עם צדדים שלישיים – ככל שיבוצעו – תהיינה בין המשתמש לבין אותו צד שלישי
            בלבד, ולחברה לא תהיה כל אחריות או מעורבות בהן.
          </p>
          <p>
            החברה שומרת לעצמה את הזכות לשנות את תנאי השימוש, מעת לעת, לפי שיקול דעתה הבלעדי. שינויים מהותיים
            יפורסמו באתר, ויחולו מרגע פרסומם. המשך שימוש באתר לאחר שינוי מהווה הסכמה לתנאים המעודכנים.
          </p>
          <p>
            סמכות שיפוט השימוש באתר וכל מחלוקת הקשורה אליו כפופה לדין הישראלי בלבד, והסמכות הבלעדית תינתן לבתי
            המשפט המוסמכים באזור תל-אביב.
          </p>
          <p>
            יצירת קשר לכל שאלה או בקשה – ניתן לפנות אלינו בדוא&quot;ל office@hiiloworld.com או דרך יצירת הקשר
            באתר.
          </p>
                    <button
                      onClick={() => setShowTerms((prev) => !prev)}
                      className="mt-4 w-full py-2 text-center text-white bg-green-500 rounded-md hover:bg-green-600"
                    >
                      סגור
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                size="lg"
                disabled={isButtonDisabled}
              >
                {getButtonLabel()}
              </Button>

              {paymentError && (
                <p className="text-sm text-red-500 text-center mt-2">
                  אירעה שגיאה ביצירת קישור התשלום: {paymentError.message}
                </p>
              )}
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const DeliveryCardSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
      <div>
        <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
      <div className="h-12 w-full bg-gray-200 rounded animate-pulse mt-4" />
    </div>
  </Card>
);
