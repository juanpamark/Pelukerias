/**
 * Pillar 4: Helper de optimización automática de medios para Cloudinary.
 * Inserta /f_auto,q_auto/ después de /image/upload/ para servir formatos ligeros (WebP/AVIF).
 */
export function optimizeMediaUrl(url: string | null | undefined): string {
  if (!url) return "";

  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    if (url.includes("/image/upload/f_auto,q_auto/")) {
      return url;
    }
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  }

  return url;
}

export function isLocalPreviewUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("data:") || url.startsWith("blob:");
}

/**
 * Redimensiona y comprime una imagen subida desde el navegador a Data URL JPEG
 * para previsualización instantánea y persistencia segura en almacenamiento local.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxDimension = 960
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(objectUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const compressed = canvas.toDataURL("image/jpeg", 0.84);
        URL.revokeObjectURL(objectUrl);
        resolve(compressed);
      } catch {
        resolve(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer el archivo de imagen."));
    };

    img.src = objectUrl;
  });
}
