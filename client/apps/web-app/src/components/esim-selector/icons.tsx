// SVG Icons for the eSIM Selector component

export const CalendarIcon = ({ className = "" }: { className?: string }) => (
  <svg 
    width="12" 
    height="11" 
    viewBox="0 0 12 11" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path 
      d="M4.125 0.5V2M7.875 0.5V2M1.5 4.025H10.5M10.5 3.5V8C10.5 9.5 9.75 10.5 7.875 10.5H4.125C2.25 10.5 1.5 9.5 1.5 8V3.5C1.5 2 2.25 1 4.125 1H7.875C9.75 1 10.5 2 10.5 3.5Z" 
      stroke="#0A232E" 
      strokeMiterlimit="10" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronsUpDownIcon = () => (
  <svg 
    width="11" 
    height="6" 
    viewBox="0 0 11 6" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path 
      d="M10 1L5.5 5.5L1 1" 
      stroke="#0A232E" 
      strokeOpacity="0.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon = () => (
  <svg 
    width="26" 
    height="26" 
    viewBox="0 0 26 26" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="13" cy="13" r="12.5" stroke="#0A232E"/>
    <path 
      d="M9 9L17 17M17 9L9 17" 
      stroke="#0A232E" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);