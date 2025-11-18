import React, { useState, useEffect, useRef } from 'react'

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  placeholder?: string
  threshold?: number
}

export const LazyImage: React.FC<LazyImageProps> = React.memo(({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E',
  threshold = 0.1,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately (using setTimeout to avoid setState in effect)
      const timer = setTimeout(() => setImageSrc(src), 0)
      return () => clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            if (imgRef.current) {
              observer.unobserve(imgRef.current)
            }
          }
        })
      },
      { threshold }
    )

    const currentImg = imgRef.current
    if (currentImg) {
      observer.observe(currentImg)
    }

    return () => {
      if (currentImg) {
        observer.unobserve(currentImg)
      }
    }
  }, [src, threshold])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      onLoad={handleLoad}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      loading="lazy"
      {...props}
    />
  )
})

LazyImage.displayName = 'LazyImage'
