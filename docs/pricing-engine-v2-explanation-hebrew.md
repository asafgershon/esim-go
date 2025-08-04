# מנוע התמחור של eSIM Go - גרסה 2
## הסבר מקיף על תהליך התמחור

---

## 📋 סקירה כללית

מנוע התמחור של eSIM Go בנוי על בסיס הספרייה `json-rules-engine` - מנוע חוקים גמיש המאפשר קביעת מחירים דינאמית על בסיס חוקים ועובדות (Facts & Rules). המערכת מחשבת את המחיר הסופי לחבילות eSIM תוך התחשבות במגוון פרמטרים כמו משך החבילה, סוג החבילה, אמצעי התשלום ועוד.

---

## 🎯 מושגי יסוד ב-json-rules-engine

### Facts (עובדות)
עובדות הן נתונים שהמנוע משתמש בהם כדי להעריך חוקים. ישנם שני סוגים:

1. **עובדות סטטיות** - נתונים קבועים שנטענים פעם אחת
2. **עובדות דינמיות** - פונקציות שמחשבות ערכים בזמן ריצה

### Events (אירועים)
כאשר תנאי של חוק מתקיים, המנוע יוצר אירוע. כל אירוע מכיל:
- `type` - סוג האירוע (למשל: "apply-markup")
- `params` - פרמטרים נוספים לעיבוד

### Rules (חוקים)
חוק מורכב משלושה חלקים:
- **Conditions** - תנאים שצריכים להתקיים
- **Event** - האירוע שיופעל אם התנאים מתקיימים
- **Priority** - סדר הרצה (מספר גבוה יותר = רץ קודם)

---

## 🔄 תהליך התמחור המלא

### שלב 1: אתחול המנוע
```typescript
engine = new Engine();

// טעינת עובדות סטטיות
engine.addFact("durations", durations);          // משכי זמן זמינים
engine.addFact("availableBundles", availableBundles); // חבילות זמינות

// טעינת עובדות דינמיות
engine.addFact("selectedBundle", selectBundle);   // בחירת חבילה מתאימה
engine.addFact("previousBundle", previousBundleFact); // חבילה קודמת
engine.addFact("unusedDays", unusedDaysFact);    // ימים לא מנוצלים
```

### שלב 2: הרצת המנוע
המנוע מקבל את הפרמטרים:
- `requestedGroup` - קבוצת החבילה (למשל: "Standard Unlimited Essential")
- `requestedValidityDays` - מספר הימים המבוקש
- `country` או `region` - מיקום גיאוגרפי
- `paymentMethod` - אמצעי תשלום

---

## 📦 החוקים במערכת

### 1. חוק המחיר הבסיסי (Cost Block)
**Priority: 100** (רץ ראשון)

```typescript
{
  name: "Cost Block",
  conditions: {
    all: [
      {
        fact: "selectedBundle",
        operator: "notEqual",
        value: null
      }
    ]
  },
  event: {
    type: "set-base-price",
    params: {
      source: "selectedBundle.cost"
    }
  }
}
```

**תפקיד**: קובע את המחיר הבסיסי מעלות החבילה שנבחרה

**דוגמה**: 
- חבילה של 7 ימים באוסטרליה עולה $45
- המחיר הבסיסי יהיה: $45

---

### 2. חוק התוספת (Markup Rule)
**Priority: 50**

```typescript
{
  name: "Markup Rule",
  conditions: {
    any: [
      {
        fact: "selectedBundle",
        path: "$.bundle_name",
        operator: "contains",
        value: "Unlimited"
      },
      {
        fact: "previousBundle",
        path: "$.bundle_name",
        operator: "contains",
        value: "Unlimited"
      }
    ]
  },
  event: {
    type: "apply-markup",
    params: {
      // מטריצת תוספות לפי סוג חבילה ומשך זמן
      markupMatrix: {
        "Standard Unlimited Lite": {
          1: 5, 3: 10, 5: 15, 7: 20, 10: 25, 15: 30, 30: 35
        },
        "Standard Unlimited Plus": {
          1: 15, 3: 25, 5: 35, 7: 45, 10: 55, 15: 65, 30: 75
        },
        "Standard Unlimited Essential": {
          1: 10, 3: 20, 5: 30, 7: 40, 10: 50, 15: 60, 30: 70
        }
      }
    }
  }
}
```

**תפקיד**: מוסיף תוספת מחיר (markup) בהתאם לסוג החבילה ומשך הזמן

**דוגמה**:
- חבילת "Standard Unlimited Essential" ל-7 ימים
- תוספת: $40
- מחיר אחרי תוספת: $45 + $40 = $85

---

### 3. חוקי עמלת עיבוד (Processing Fee Rules)
**Priority: 30**

```typescript
// כרטיס ישראלי
{
  name: "Israeli Card Processing Fee",
  conditions: {
    all: [
      {
        fact: "paymentMethod",
        operator: "equal",
        value: "ISRAELI_CARD"
      }
    ]
  },
  event: {
    type: "apply-processing-fee",
    params: {
      rate: 0.014  // 1.4%
    }
  }
}

// כרטיס בינלאומי
{
  name: "International Card Processing Fee",
  conditions: {
    all: [
      {
        fact: "paymentMethod",
        operator: "equal",
        value: "INTERNATIONAL_CARD_DINERS"
      }
    ]
  },
  event: {
    type: "apply-processing-fee",
    params: {
      rate: 0.039  // 3.9%
    }
  }
}
```

**תפקיד**: מחשב עמלת עיבוד לפי אמצעי התשלום

**דוגמה**:
- מחיר אחרי תוספת: $85
- עמלה לכרטיס ישראלי (1.4%): $85 × 0.014 = $1.19
- עלות כוללת: $85 + $1.19 = $86.19

---

### 4. חוק הנחת ימים לא מנוצלים (Unused Days Discount)
**Priority: 85**

```typescript
{
  name: "Unused Days Discount",
  conditions: {
    all: [
      {
        fact: "isExactMatch",
        operator: "equal",
        value: false
      },
      {
        fact: "unusedDays",
        operator: "greaterThan",
        value: 0
      }
    ]
  },
  event: {
    type: "apply-unused-days-discount",
    params: {
      calculateDiscount: true
    }
  }
}
```

**תפקיד**: מעניק הנחה כאשר הלקוח לא צריך את כל משך החבילה

**דוגמה**:
- לקוח מבקש 8 ימים אבל החבילה הקרובה היא 10 ימים
- ימים לא מנוצלים: 2
- ההנחה מחושבת על בסיס ההפרש בין החבילה הנוכחית לקודמת

---

## 🔧 עיבוד האירועים (Processing Strategy)

### האסטרטגיה הנוכחית - Default Strategy

האסטרטגיה מעבדת את האירועים בסדר הבא:

#### 1. קביעת מחיר בסיס
```typescript
const { newPrice: cost } = await processEventType(
  "set-base-price",
  selectEvents(events, "set-base-price"),
  0,
  almanac
);
```

#### 2. הוספת תוספת (Markup)
```typescript
const { change: markup, newPrice: priceWithMarkup } = await processEventType(
  "apply-markup",
  markups,
  cost,
  almanac
);
```

#### 3. החלת הנחת ימים לא מנוצלים
```typescript
const {
  change: discountValue,
  newPrice: priceAfterDiscount,
  details: { valuePerDay, discountRate, unusedDays }
} = await processEventType(
  "apply-unused-days-discount",
  discount,
  priceWithMarkup,
  almanac
);
```

#### 4. חישוב עמלת עיבוד
```typescript
const {
  change: processingFee,
  details: { rate }
} = await processEventType(
  "apply-processing-fee",
  processingFees,
  priceAfterDiscount,
  almanac
);
```

#### 5. שמירה על רווח מינימלי
```typescript
const { newPrice: priceAfterKeepProfit } = await processEventType(
  "apply-profit-constraint",
  keepProfit,
  priceAfterDiscount,
  almanac
);
```

#### 6. עיגול פסיכולוגי
```typescript
const { newPrice: priceAfterPsychologicalRounding } = await processEventType(
  "apply-psychological-rounding",
  psychologicalRounding,
  priceAfterKeepProfit,
  almanac
);
```

---

## 📊 דוגמה מלאה לחישוב מחיר

### תרחיש: 
לקוח מאוסטרליה מבקש חבילת "Standard Unlimited Essential" ל-8 ימים, משלם בכרטיס ישראלי

### שלבי החישוב:

#### שלב 1: בחירת חבילה
- החבילה הקרובה ביותר: 10 ימים
- מחיר בסיס: $55
- ימים לא מנוצלים: 2

#### שלב 2: תוספת
- תוספת ל-10 ימים: $50
- מחיר אחרי תוספת: $55 + $50 = $105

#### שלב 3: הנחת ימים לא מנוצלים
- חבילה קודמת (7 ימים): $45 + $40 = $85
- הפרש: $105 - $85 = $20
- הנחה ל-2 ימים: $20 × (2/3) = $13.33
- מחיר אחרי הנחה: $105 - $13.33 = $91.67

#### שלב 4: עמלת עיבוד
- עמלה (1.4%): $91.67 × 0.014 = $1.28
- עלות כוללת: $91.67 + $1.28 = $92.95

#### שלב 5: עיגול פסיכולוגי
- מחיר סופי: $92.99

---

## 🎨 התוצאה הסופית

המערכת מחזירה אובייקט מפורט:

```typescript
{
  selectedBundle: {
    id: "bundle-123",
    bundle_name: "Standard Unlimited Essential",
    validity_in_days: 10,
    cost: 55,
    country: "AU"
  },
  unusedDays: 2,
  requestedDays: 8,
  pricing: {
    cost: 55,                    // מחיר בסיס
    markup: 50,                  // תוספת
    currency: "USD",
    unusedDays: 2,
    discountValue: 13.33,        // הנחה
    discountRate: 0.67,          // אחוז הנחה
    priceAfterDiscount: 91.67,
    processingCost: 1.28,        // עמלת עיבוד
    processingRate: 0.014,       // אחוז עמלה
    totalCost: 92.95,            // עלות כוללת
    finalPrice: 92.99,           // מחיר סופי ללקוח
    finalRevenue: 91.71,         // הכנסה נטו
    netProfit: 36.71             // רווח נקי
  },
  appliedRules: [
    "Cost Block",
    "Markup Rule",
    "Unused Days Discount",
    "Israeli Card Processing Fee"
  ]
}
```

---

## 🚀 יתרונות המערכת

### 1. גמישות
- קל להוסיף חוקים חדשים
- אפשר לשנות פרמטרים ללא שינוי קוד
- תמיכה באסטרטגיות תמחור שונות

### 2. שקיפות
- כל שלב בחישוב מתועד
- אפשר לעקוב אחרי החוקים שהופעלו
- פירוט מלא של המחיר הסופי

### 3. ביצועים
- המנוע מבצע אופטימיזציות אוטומטיות
- חישובים מקביליים כשאפשר
- זמן ריצה ממוצע: פחות מ-10ms

### 4. תחזוקה
- הפרדה ברורה בין לוגיקה עסקית לקוד
- בדיקות יחידה קלות לכתיבה
- קל לדבג ולנתח בעיות

---

## 🔮 תוכניות עתידיות

### אסטרטגיות ניתנות לעריכה
בעתיד, האסטרטגיה תהיה ניתנת לעריכה דרך ממשק משתמש:
- יצירת אסטרטגיות מותאמות אישית לשווקים שונים
- A/B Testing של אסטרטגיות תמחור
- התאמה דינמית לפי ביצועים

### חוקים נוספים
- הנחות לקנייה חוזרת
- תמחור דינמי לפי ביקוש
- הנחות קבוצתיות
- מבצעים עונתיים

---

## 📝 סיכום

מנוע התמחור של eSIM Go מספק פתרון מקיף וגמיש לחישוב מחירים מורכבים. השימוש ב-json-rules-engine מאפשר הפרדה ברורה בין הלוגיקה העסקית לקוד, מה שהופך את המערכת לקלה לתחזוקה ולהרחבה. האסטרטגיה הנוכחית מכסה את כל המקרים הבסיסיים, ומאפשרת הרחבה קלה בעתיד.