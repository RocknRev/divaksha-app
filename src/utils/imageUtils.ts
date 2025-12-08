/**
 * Compress an image file to reduce size
 * @param file - The image file to compress
 * @returns Promise resolving to base64 string of compressed image
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => {
      reject(err);
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let width = img.width;
      let height = img.height;

      // Resize based on width
      if (width > 1080) {
        height = (1080 / width) * height;
        width = 1080;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      // Compress to JPEG
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

      resolve(compressedBase64);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
};

