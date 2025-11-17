import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Logo: React.FC<LogoProps> = React.memo(({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <svg
      className={`${sizeMap[size]} ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Visa Evaluation Tool Logo"
    >
      {/* Globe/World Icon */}
      <circle cx="50" cy="50" r="45" fill="#3B82F6" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2" />
      
      {/* Latitude lines */}
      <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="50" cy="50" rx="40" ry="25" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
      
      {/* Longitude line */}
      <ellipse cx="50" cy="50" rx="15" ry="40" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
      
      {/* Checkmark overlay */}
      <path
        d="M35 50 L45 60 L65 35"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
})

Logo.displayName = 'Logo'
