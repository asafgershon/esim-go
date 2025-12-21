"use client";

import "./AnnouncementBanner.css";

const messages = [
  "eSIM ללא הגבלת נפח גלישה",
  "eSIM עם אין סוף ג׳יגה-בייט",
  "eSIM במחיר המשתלם ביותר",
  "שירות 24/7 בעברית",
  "התקנת eSIM בקליק!",
  "מתאים לאייפון ואנדרואיד",
  "חבילת eSIM תוך דקה למייל",
  "תמיכה טכנית בוואטסאפ",
  "100% שביעות רצון מובטחת",
  "מגוון חבילות לכל מדינה בעולם",
];

export default function AnnouncementBanner() {
  return (
    <div className="announcement-container">
      <div className="announcement-track">
        {/* אותו שכפול ×3 כמו אצלך */}
        {[...messages, ...messages, ...messages].map((msg, i) => (
          <span key={i} className="announcement-message">
            {msg}
            <span className="dot">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
