/** Resize image client-side before upload (max 2048px, JPEG 0.85). */
export async function prepareReceiptFile(file) {
  if (file.type === 'application/pdf') return file;
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const max = 2048;
  let { width, height } = bitmap;
  if (width > max || height > max) {
    const scale = max / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85)
  );
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}
