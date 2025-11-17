import { useState, useCallback } from 'react'

/** Maximum file size: 5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/** Allowed file MIME types for document upload */
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]

/**
 * Custom hook for handling file uploads with validation
 * 
 * Provides file management functionality with built-in validation for:
 * - File size (max 5MB per file)
 * - File type (PDF, DOC, DOCX, JPG, PNG only)
 * 
 * @returns {Object} Hook state and functions
 * @returns {File[]} returns.files - Array of validated files
 * @returns {string[]} returns.errors - Array of validation error messages
 * @returns {Function} returns.addFiles - Function to add and validate new files
 * @returns {Function} returns.removeFile - Function to remove a file by index
 * @returns {Function} returns.clearFiles - Function to clear all files and errors
 * 
 * @example
 * ```typescript
 * const { files, errors, addFiles, removeFile, clearFiles } = useFileUpload()
 * 
 * // Add files (e.g., from drag-and-drop or file input)
 * const handleDrop = (acceptedFiles: File[]) => {
 *   addFiles(acceptedFiles)
 * }
 * 
 * // Display errors
 * {errors.map(error => <p key={error}>{error}</p>)}
 * 
 * // Display files
 * {files.map((file, index) => (
 *   <div key={index}>
 *     {file.name}
 *     <button onClick={() => removeFile(index)}>Remove</button>
 *   </div>
 * ))}
 * ```
 */
export const useFileUpload = () => {
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])

  /**
   * Validate a single file
   * @param file - File to validate
   * @returns Error message if validation fails, null otherwise
   */
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 5MB`
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG`
    }
    return null
  }

  /**
   * Add files with validation
   * @param newFiles - Array of files to add
   */
  const addFiles = useCallback((newFiles: File[]) => {
    const validationErrors: string[] = []
    const validFiles: File[] = []

    newFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    setErrors(validationErrors)
    setFiles(prev => [...prev, ...validFiles])
  }, [])

  /**
   * Remove a file by index
   * @param index - Index of file to remove
   */
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Clear all files and errors
   */
  const clearFiles = useCallback(() => {
    setFiles([])
    setErrors([])
  }, [])

  return { files, errors, addFiles, removeFile, clearFiles }
}
