import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    return file
  }

  const fileSizeKB = file.size / 1024

  if (fileSizeKB <= 500) {
    return file
  }

  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    preserveExifData: false,
    fileType: file.type as string,
    onProgress: undefined,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Image compression failed, using original file:', error)
    return file
  }
}
