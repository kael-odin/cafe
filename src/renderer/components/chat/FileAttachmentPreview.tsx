/**
 * File Attachment Preview - Display attached documents
 * Shows file name, size, and type icon
 */

import { X, FileText, Book, FileJson, Table } from 'lucide-react'
import type { FileAttachment } from '../../types'
import { formatFileSize, getFileIcon } from '../../utils/fileProcessor'
import { useTranslation } from '../../i18n'

interface FileAttachmentPreviewProps {
  files: FileAttachment[]
  onRemove: (id: string) => void
}

/**
 * Get Lucide icon component based on file type
 */
function getFileIconComponent(fileName: string) {
  const iconName = getFileIcon(fileName)
  
  switch (iconName) {
    case 'book':
      return Book
    case 'file-json':
      return FileJson
    case 'table':
      return Table
    default:
      return FileText
  }
}

/**
 * Get display name for MIME type
 */
function getMimeTypeLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
    'text/plain': 'TXT',
    'text/markdown': 'MD',
    'application/json': 'JSON',
    'text/csv': 'CSV',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-excel': 'XLS'
  }
  
  return labels[mimeType] || 'FILE'
}

function getParseStatusLabel(file: FileAttachment): string | null {
  switch (file.parseStatus) {
    case 'parsed':
      return '已解析'
    case 'fallback':
      return '已附加'
    case 'failed':
      return '解析失败'
    case 'pending':
      return '解析中'
    default:
      return null
  }
}

export function FileAttachmentPreview({ files, onRemove }: FileAttachmentPreviewProps) {

  const { t } = useTranslation()
  
  if (files.length === 0) return null
  
  return (
    <div className="px-3.5 pt-3.5 border-b border-border/30">
      <div className="flex flex-wrap gap-2">
        {files.map((file) => {
          const IconComponent = getFileIconComponent(file.name || '')
          const mimeTypeLabel = getMimeTypeLabel(file.mediaType)
          
          return (
            <div
              key={file.id}
              className="group relative flex items-center gap-2 px-3 py-2
                bg-muted/30 border border-border/40 rounded-xl
                hover:border-primary/30 transition-colors duration-200
                max-w-[280px]"
            >
              {/* File icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 
                flex items-center justify-center">
                <IconComponent size={16} className="text-primary" />
              </div>
              
              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-primary/70">{mimeTypeLabel}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.size || 0)}</span>
                  {getParseStatusLabel(file) && (
                    <>
                      <span>•</span>
                      <span className={file.parseStatus === 'failed' ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}>
                        {getParseStatusLabel(file)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Remove button */}
              <button
                onClick={() => onRemove(file.id)}
                className="flex-shrink-0 w-6 h-6 rounded-md
                  bg-muted/50 hover:bg-destructive/10
                  flex items-center justify-center
                  text-muted-foreground hover:text-destructive
                  transition-colors duration-150
                  opacity-0 group-hover:opacity-100"
                title={t('Remove file')}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
