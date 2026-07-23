'use client'

import { useRef } from 'react'

const MAX_PHOTOS = 10
const MAX_VIDEOS = 1
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024

type MediaPickerProps = {
  files: File[]
  onChange: (files: File[]) => void
  invalid?: boolean
  required?: boolean
}

function isPhoto(file: File) {
  return file.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name)
}

function isVideo(file: File) {
  return file.type.startsWith('video/') || /\.(mov|mp4|webm)$/i.test(file.name)
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function validateMediaFiles(files: File[]) {
  const photos = files.filter(isPhoto)
  const videos = files.filter(isVideo)
  const unsupported = files.filter((file) => !isPhoto(file) && !isVideo(file))
  const oversizedVideo = videos.find((file) => file.size > MAX_VIDEO_SIZE_BYTES)

  if (unsupported.length) {
    return 'Please upload photos or one short video only.'
  }

  if (photos.length > MAX_PHOTOS) {
    return `Please upload no more than ${MAX_PHOTOS} photos.`
  }

  if (videos.length > MAX_VIDEOS) {
    return 'Please upload no more than one video.'
  }

  if (oversizedVideo) {
    return 'Please keep the video under 50 MB for this test version.'
  }

  return ''
}

export default function MediaPicker({ files, onChange, invalid = false, required = false }: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const error = validateMediaFiles(files)
  const photos = files.filter(isPhoto).length
  const videos = files.filter(isVideo).length

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    onChange([...files, ...Array.from(fileList)])
  }

  function removeFile(index: number) {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  return (
    <>
      <div className="upload-grid">
        <div className={`upload-card${invalid ? ' upload-card-error' : ''}`}>
          <span>Choose from device</span>
          <button
            className={`btn secondary upload-button${invalid ? ' upload-button-error' : ''}`}
            type="button"
            aria-invalid={invalid}
            onClick={() => inputRef.current?.click()}
          >
            {invalid && (
              <span className="required-badge" aria-hidden="true">
                !
              </span>
            )}
            Upload Photos / Videos
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={(event) => {
              addFiles(event.currentTarget.files)
              event.currentTarget.value = ''
            }}
          />

          <p className="muted">
            Add up to {MAX_PHOTOS} photos and {MAX_VIDEOS} short video. Selected: {photos} photo
            {photos === 1 ? '' : 's'}, {videos} video{videos === 1 ? '' : 's'}.
          </p>

          {required && !files.length && <p className="muted">At least one vehicle photo is required.</p>}
          {error && <p className="upload-error">{error}</p>}

          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, index) => (
                <div className="file-row" key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                  <span>
                    {file.name} <small>{formatSize(file.size)}</small>
                  </span>
                  <button type="button" className="remove-file" onClick={() => removeFile(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
