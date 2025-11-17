import React, { useMemo } from 'react'

/**
 * Props for the Button component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: 'primary' | 'outline' | 'ghost'
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the button is in a loading state */
  loading?: boolean
  /** Button content */
  children: React.ReactNode
}

/**
 * Reusable Button component with multiple variants and sizes
 * 
 * @component
 * @example
 * ```tsx
 * // Primary button
 * <Button onClick={handleClick}>Submit</Button>
 * 
 * // Outline button with loading state
 * <Button variant="outline" loading={isLoading}>
 *   Save
 * </Button>
 * 
 * // Large ghost button
 * <Button variant="ghost" size="lg">
 *   Cancel
 * </Button>
 * ```
 * 
 * @param {ButtonProps} props - Component props
 * @returns {JSX.Element} Rendered button element
 */
export const Button: React.FC<ButtonProps> = React.memo(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500'
  }
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
  }
  
  // Memoize combined className
  const combinedClassName = useMemo(
    () => `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`,
    [variant, size, className]
  )
  
  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
})
