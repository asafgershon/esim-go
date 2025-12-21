import React from 'react';

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
    <div style={{
      position: 'relative',
      backgroundColor: '#0c1f2c',
      color: 'white',
      overflow: 'hidden',
      height: '40px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        whiteSpace: 'nowrap',
        animation: 'marquee-scroll 60s linear infinite'
      }}>
        {/* Duplicate messages 3 times for smoother loop */}
        {[...messages, ...messages, ...messages].map((msg, i) => (
          <span key={i} style={{
            margin: 0,
            padding: '0 12px',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap'
          }}>
            {msg}
            <span style={{
              color: '#4ade80',
              fontWeight: 'bold',
              margin: '0 24px',
              fontSize: '16px'
            }}>•</span>
          </span>
        ))}
      </div>
      
      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  );
}