"use client";

import React from "react";

interface BackgroundSectionProps {
  children?: React.ReactNode;
}

export function BackgroundSection({ children }: BackgroundSectionProps) {
  return (
    <div className="relative min-h-screen overflow-hidden rounded-[100px] sm:rounded-[50px]">
      {/* Desktop SVG Background - Hidden on mobile */}
      <svg
        className="absolute inset-0 w-full h-full hidden md:block"
        viewBox="-200 -200 2320 2263"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_134_2697)">
          <rect width="1920" height="1863" rx="100" fill="#0A232E" />
          <path
            d="M-68.7062 639.274L-551.595 89.1725L343.419 -696.493L826.308 -146.392C611.394 -124.363 499.483 -46.7144 436.942 20.5699C302.37 165.342 331.747 331.587 170.817 492.822C88.2288 575.552 -4.79709 617.219 -68.7062 639.274Z"
            fill="#00E095"
          />
          <path
            d="M-105.755 555.988L-530.063 50.6729L294.269 -647.663L718.577 -142.348C524.133 -125.566 421.492 -56.8942 363.63 3.11915C239.127 132.247 262.153 283.239 113.513 426.887C37.232 500.593 -47.6078 536.957 -105.755 555.988Z"
            fill="#535FC8"
          />
          <path
            d="M2032.53 1131.51L2515.41 1681.62L1620.4 2467.28L1137.51 1917.18C1352.43 1895.15 1464.34 1817.5 1526.88 1750.22C1661.45 1605.45 1632.07 1439.2 1793 1277.97C1875.59 1195.24 1968.62 1153.57 2032.53 1131.51Z"
            fill="#00E095"
          />
          <path
            d="M2069.57 1214.8L2493.88 1720.12L1669.55 2418.45L1245.24 1913.14C1439.69 1896.35 1542.33 1827.68 1600.19 1767.67C1724.69 1638.54 1701.67 1487.55 1850.31 1343.9C1926.59 1270.2 2011.43 1233.83 2069.57 1214.8Z"
            fill="#535FC8"
          />
        </g>
        <defs>
          <clipPath id="clip0_134_2697">
            <rect width="1920" height="1863" rx="100" fill="white" />
          </clipPath>
        </defs>
      </svg>

      {/* Mobile SVG Background - Visible only on mobile */}
      <svg
        className="absolute inset-0 w-full h-full md:hidden block"
        viewBox="-50 -100 515 665"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_134_2681)">
          <path
            d="M0 1346L-9.73016e-05 -880L415 -880L415 1346L0 1346Z"
            fill="#0A232E"
          />
          <path
            d="M543 -8.46252L435.079 -282.573L-129.532 -143.88L-21.6116 130.23C43.3875 62.8346 105.265 41.2798 149.964 34.1223C246.142 18.7197 308.947 62.5627 418.926 41.7098C475.36 31.0051 517.105 8.407 543 -8.46252Z"
            fill="#00E095"
          />
          <path
            d="M533 -32.7584L425.079 -306.869L-139.532 -168.176L-31.6116 105.935C33.3875 38.5387 95.2648 16.9839 139.964 9.82639C236.142 -5.57622 298.947 38.2668 408.926 17.4139C465.36 6.70918 507.105 -15.8889 533 -32.7584Z"
            fill="#535FC8"
          />
          <path
            d="M-139.532 471.593L-31.6115 745.704L533 607.011L425.079 332.9C360.08 400.296 298.203 421.851 253.504 429.009C157.326 444.411 94.5204 400.568 -15.4578 421.421C-71.8918 432.126 -113.637 454.724 -139.532 471.593Z"
            fill="#00E095"
          />
          <path
            d="M-129.532 495.889L-21.6115 770L543 631.307L435.079 357.196C370.08 424.592 308.203 446.147 263.504 453.304C167.326 468.707 104.52 424.864 -5.4578 445.717C-61.8918 456.422 -103.637 479.20 -129.532 495.889Z"
            fill="#535FC8"
          />
        </g>
        <defs>
          <clipPath id="clip0_134_2681">
            <rect
              y="465"
              width="465"
              height="415"
              rx="50"
              transform="rotate(-90 0 465)"
              fill="white"
            />
          </clipPath>
        </defs>
      </svg>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center pt-20 md:pt-20">
        {children}
      </div>
    </div>
  );
}