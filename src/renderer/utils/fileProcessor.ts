/**
 * File Processor - Document file handling utilities
 * Supports text-like files directly and PDF/DOC/DOCX via MinerU parsing.
 */

import type { FileAttachment, DocumentMediaType } from '../types'

export const SUPPORTED_DOCUMENT_TYPES: DocumentMediaType[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv'
]

const EXTENSION_TO_MIME: Record<string, DocumentMediaType> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv'
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

export function isValidDocumentType(file: File): boolean {
  if (SUPPORTED_DOCUMENT_TYPES.includes(file.type as DocumentMediaType)) {
    return true
  }

  const fileName = file.name.toLowerCase()
  for (const ext of Object.keys(EXTENSION_TO_MIME)) {
    if (fileName.endsWith(ext)) {
      return true
    }
  }

  return false
}

export function getDocumentMimeType(file: File): DocumentMediaType {
  if (SUPPORTED_DOCUMENT_TYPES.includes(file.type as DocumentMediaType)) {
    return file.type as DocumentMediaType
  }

  const fileName = file.name.toLowerCase()
  for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
    if (fileName.endsWith(ext)) {
      return mime
    }
  }

  return 'text/plain'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileIcon(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()

  const iconMap: Record<string, string> = {
    pdf: 'file-text',
    doc: 'file-text',
    docx: 'file-text',
    txt: 'file-text',
    md: 'book',
    json: 'file-json',
    csv: 'table'
  }

  return iconMap[ext || ''] || 'file'
}

export async function processDocumentFile(file: File): Promise<FileAttachment | null> {
  if (!isValidDocumentType(file)) {
    throw new Error(`Unsupported file format: ${file.type || file.name || 'unknown'}`)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${formatFileSize(file.size)}), max 50MB`)
  }

  try {
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
    throw new Error(`Failed to process file: ${file.name}`)
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength))
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

export function getAcceptedFileTypes(): string {
  const mimeTypes = SUPPORTED_DOCUMENT_TYPES.join(',')
  const extensions = '.pdf,.docx,.doc,.txt,.md,.json,.csv'
  return `${mimeTypes},${extensions}`
}
