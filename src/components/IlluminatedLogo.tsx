import React from 'react';

interface IlluminatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const IlluminatedLogo: React.FC<IlluminatedLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizePx = size === 'sm' ? 40 : size === 'md' ? 64 : 96;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Vector Emblem Seal */}
      <svg
        width={sizePx}
        height={sizePx}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        {/* Outer Circular Decorative Border */}
        <circle cx="100" cy="100" r="96" stroke="#d4af37" strokeWidth="3" fill="#121212" />
        <circle cx="100" cy="100" r="90" stroke="#d4af37" strokeWidth="1.2" strokeDasharray="4 2" />
        <circle cx="100" cy="100" r="82" stroke="#d4af37" strokeWidth="2" />
        <circle cx="100" cy="100" r="74" stroke="#888888" strokeWidth="1" />

        {/* Gear / Cog inner ring background */}
        <circle cx="100" cy="100" r="62" stroke="#d4af37" strokeWidth="2" fill="#1a1a1a" />
        
        {/* Gear teeth hints around ring */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + 62 * Math.cos(angle);
          const y1 = 100 + 62 * Math.sin(angle);
          const x2 = 100 + 68 * Math.cos(angle);
          const y2 = 100 + 68 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#d4af37"
              strokeWidth="3"
            />
          );
        })}

        {/* Ornate Filigree Corner Accents */}
        <path
          d="M 100 12 C 80 20 60 20 40 12 C 55 30 55 45 40 55 C 60 45 80 50 100 32"
          stroke="#d4af37"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M 100 12 C 120 20 140 20 160 12 C 145 30 145 45 160 55 C 140 45 120 50 100 32"
          stroke="#d4af37"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Roman Numerals "I" and "A" */}
        {/* 'I' on Left */}
        <text
          x="62"
          y="108"
          fill="#d4af37"
          fontSize="28"
          fontFamily="Times New Roman, serif"
          fontWeight="bold"
          textAnchor="middle"
        >
          I
        </text>

        {/* 'A' on Right */}
        <text
          x="138"
          y="108"
          fill="#d4af37"
          fontSize="28"
          fontFamily="Times New Roman, serif"
          fontWeight="bold"
          textAnchor="middle"
        >
          A
        </text>

        {/* Center Open Book / Manuscript */}
        <path
          d="M 50 125 Q 100 110 100 142 Q 100 110 150 125 L 148 145 Q 100 132 100 155 Q 100 132 52 145 Z"
          fill="#d4af37"
          stroke="#fff"
          strokeWidth="0.8"
        />
        {/* Book Spine Lines */}
        <path d="M 100 110 L 100 155" stroke="#121212" strokeWidth="2" />
        <path d="M 58 132 Q 80 125 95 130" stroke="#121212" strokeWidth="1" fill="none" />
        <path d="M 58 138 Q 80 131 95 136" stroke="#121212" strokeWidth="1" fill="none" />
        <path d="M 105 130 Q 120 125 142 132" stroke="#121212" strokeWidth="1" fill="none" />
        <path d="M 105 136 Q 120 131 142 138" stroke="#121212" strokeWidth="1" fill="none" />

        {/* Flame of Knowledge Rising from Book */}
        <path
          d="M 100 105 C 90 90 92 75 100 55 C 108 75 110 90 100 105 Z"
          fill="#e5c05e"
          stroke="#d4af37"
          strokeWidth="1.5"
        />
        <path
          d="M 100 100 C 95 90 96 82 100 70 C 104 82 105 90 100 100 Z"
          fill="#ffffff"
        />

        {/* Quill Feather across the book & flame */}
        <path
          d="M 125 65 C 115 85 100 110 80 135 C 82 132 95 110 120 85 Z"
          fill="#f5f5f5"
          stroke="#d4af37"
          strokeWidth="1"
        />
        <path d="M 125 65 L 75 140" stroke="#d4af37" strokeWidth="1.5" />
      </svg>

      {/* Company Name Block */}
      {showText && (
        <div className="mt-2 text-[#d4af37] font-serif tracking-widest uppercase text-center leading-tight">
          <div className="font-bold text-xs sm:text-sm tracking-[0.25em] text-[#e5c05e]">
            ILLUMINATED
          </div>
          <div className="font-semibold text-[10px] sm:text-xs tracking-[0.2em] text-[#e0e0e0]">
            ADAPTIVE
          </div>
          <div className="font-bold text-[11px] sm:text-xs tracking-[0.3em] text-[#d4af37]">
            E-WORKS
          </div>
        </div>
      )}
    </div>
  );
};
