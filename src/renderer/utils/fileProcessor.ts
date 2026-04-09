/**
 * File Processor - Document file handling utilities
 * Supports PDF, DOCX, TXT, MD, JSON, CSV, XLS, XLSX
 */

import type { FileAttachment, DocumentMediaType } from '../types'

// Supported document MIME types
export const SUPPORTED_DOCUMENT_TYPES: DocumentMediaType[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword', // DOC
  'text/plain', // TXT
  'text/markdown', // MD
  'application/json', // JSON
  'text/csv', // CSV
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'application/vnd.ms-excel' // XLS
]

// File extension to MIME type mapping
const EXTENSION_TO_MIME: Record<string, DocumentMediaType> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel'
}

// Max file size (50MB for documents, larger than images)
const MAX_FILE_SIZE = 50 * 1024 * 1024

/**
 * Check if a file is a valid document type
 */
export function isValidDocumentType(file: File): boolean {
  // Check MIME type
  if (SUPPORTED_DOCUMENT_TYPES.includes(file.type as DocumentMediaType)) {
    return true
  }
  
  // Fallback: check file extension
  const fileName = file.name.toLowerCase()
  for (const ext of Object.keys(EXTENSION_TO_MIME)) {
    if (fileName.endsWith(ext)) {
      return true
    }
  }
  
  return false
}

/**
 * Get MIME type from file
 */
export function getDocumentMimeType(file: File): DocumentMediaType {
  // Try MIME type first
  if (SUPPORTED_DOCUMENT_TYPES.includes(file.type as DocumentMediaType)) {
    return file.type as DocumentMediaType
  }
  
  // Fallback to extension
  const fileName = file.name.toLowerCase()
  for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
    if (fileName.endsWith(ext)) {
      return mime
    }
  }
  
  // Default to plain text
  return 'text/plain'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get file icon name based on extension
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  
  const iconMap: Record<string, string> = {
    'pdf': 'file-text',
    'doc': 'file-text',
    'docx': 'file-text',
    'txt': 'file-text',
    'md': 'book',
    'json': 'file-json',
    'csv': 'table',
    'xls': 'table',
    'xlsx': 'table'
  }
  
  return iconMap[ext || ''] || 'file'
}

/**
 * Process a document file into FileAttachment
 */
export async function processDocumentFile(file: File): Promise<FileAttachment | null> {
  // Validate type
  if (!isValidDocumentType(file)) {
    throw new Error(`不支持的文件格式: ${file.type || '未知'}`)
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件过大 (${formatFileSize(file.size)})，最大支持 50MB`)
  }

  try {
    // Read file as base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    
    return {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'file',
      mediaType: getDocumentMimeType(file),
      data: base64,
      name: file.name,
      size: file.size
    }
  } catch (error) {
    console.error(`Failed to process document: ${file.name}`, error)
    throw new Error(`处理文件失败: ${file.name}`)
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Get accepted file types string for input element
 * Returns both MIME types and extensions for maximum browser compatibility
 */
export function getAcceptedFileTypes(): string {
  // Include both MIME types and common extensions for better browser support
  const mimeTypes = SUPPORTED_DOCUMENT_TYPES.join(',')
  const extensions = '.pdf,.docx,.doc,.txt,.md,.json,.csv,.xlsx,.xls'
  return `${mimeTypes},${extensions}`
}
