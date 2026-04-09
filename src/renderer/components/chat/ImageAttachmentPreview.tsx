/**
 * ImageAttachmentPreview - Display attached images in input area
 * Features:
 * - Grid layout for multiple images
 * - Hover to show delete button
 * - Click to preview full size with ImageViewer
 * - Smooth animations
 */

import { useState } from 'react'
import { X, Image as ImageIcon, FileText, Book, FileJson, Table } from 'lucide-react'
import { ImageViewer } from './ImageViewer'
import type { ImageAttachment, FileAttachment } from '../../types'
import { useTranslation } from '../../i18n'

interface ImageAttachmentPreviewProps {
  images: ImageAttachment[]
  onRemove: (id: string) => void
  maxDisplay?: number
}

export function ImageAttachmentPreview({
  images,
  onRemove,
  maxDisplay = 4
}: ImageAttachmentPreviewProps) {
  const { t } = useTranslation()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (images.length === 0) return null

  const displayImages = images.slice(0, maxDisplay)
  const remainingCount = images.length - maxDisplay

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 p-2 animate-fade-in">
        {displayImages.map((image, index) => (
          <div
            key={image.id}
            className="relative group"
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            {/* Image thumbnail - clickable to preview */}
            <div
              className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary/50
                border border-border/50 transition-all duration-200
                group-hover:border-primary/30 group-hover:shadow-sm
                cursor-pointer"
              onClick={() => openViewer(index)}
            >
              <img
                src={`data:${image.mediaType};base64,${image.data}`}
                alt={image.name || t('Attached image')}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Delete button - appears on hover, positioned outside overflow container */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(image.id)
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                bg-destructive text-destructive-foreground
                flex items-center justify-center
                opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
                transition-all duration-150 shadow-sm z-10
                hover:bg-destructive/90"
              title={t('Remove image')}
            >
              <X size={12} strokeWidth={2.5} />
            </button>

            {/* File size indicator */}
            {image.size && (
              <div className="absolute bottom-0.5 left-0.5 right-0.5
                text-[9px] text-center text-white/90
                bg-black/50 backdrop-blur-sm rounded-b-md
                opacity-0 group-hover:opacity-100 transition-opacity">
                {formatFileSize(image.size)}
              </div>
            )}
          </div>
        ))}

        {/* More images indicator */}
        {remainingCount > 0 && (
          <div className="w-16 h-16 rounded-lg bg-secondary/50 border border-border/50
            flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon size={16} />
            <span className="text-xs mt-0.5">+{remainingCount}</span>
          </div>
        )}
      </div>

      {/* Image viewer modal */}
      {viewerOpen && (
        <ImageViewer
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// Single image display in message bubble
interface MessageImageProps {
  images: ImageAttachment[]
}

export function MessageImages({ images }: MessageImageProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (!images || images.length === 0) return null

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  // Single image - larger display
  if (images.length === 1) {
    return (
      <>
        <div className="mb-2">
          <img
            src={`data:${images[0].mediaType};base64,${images[0].data}`}
            alt={images[0].name || 'Image'}
            className="max-w-full max-h-64 rounded-lg object-contain cursor-pointer
              hover:opacity-95 transition-opacity"
            onClick={() => openViewer(0)}
          />
        </div>
        {viewerOpen && (
          <ImageViewer
            images={images}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </>
    )
  }

  // Multiple images - grid layout
  return (
    <>
      <div className={`mb-2 grid gap-1.5 ${
        images.length === 2 ? 'grid-cols-2' :
        images.length === 3 ? 'grid-cols-3' :
        'grid-cols-2'
      }`}>
        {images.slice(0, 4).map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer
              hover:opacity-95 transition-opacity"
            onClick={() => openViewer(index)}
          >
            <img
              src={`data:${image.mediaType};base64,${image.data}`}
              alt={image.name || `Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Show remaining count on last image */}
            {index === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-medium">+{images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {viewerOpen && (
        <ImageViewer
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

// ============================================
// File Attachments in Message Bubble
// ============================================

/**
 * Get Lucide icon component based on file type
 */
function getFileIconComponent(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop()
  
  switch (ext) {
    case 'md':
      return Book
    case 'json':
      return FileJson
    case 'csv':
    case 'xls':
    case 'xlsx':
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

// Single file display in message bubble
interface MessageFilesProps {
  files: FileAttachment[]
}

export function MessageFiles({ files }: MessageFilesProps) {
  const { t } = useTranslation()

  if (!files || files.length === 0) return null

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {files.map((file) => {
        const IconComponent = getFileIconComponent(file.name || '')
        const mimeTypeLabel = getMimeTypeLabel(file.mediaType)
        
        return (
          <div
            key={file.id}
            className="flex items-center gap-2 px-3 py-2
              bg-secondary/30 border border-border/50 rounded-lg
              max-w-[240px]"
          >
            {/* File icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 
              flex items-center justify-center">
              <IconComponent size={16} className="text-primary" />
            </div>
            
            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {file.name}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="font-medium text-primary/70">{mimeTypeLabel}</span>
                {file.size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(file.size)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
