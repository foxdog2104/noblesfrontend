const DEFAULT_OPTIONS = {
  maxDimension: 1600,
  quality: 0.78,
  outputType: 'image/jpeg',
};

const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);

const getImageName = (name, outputType) => {
  const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = name.replace(/\.[^.]+$/, '') || 'image';

  return `${baseName}.${extension}`;
};

const loadImage = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  const url = URL.createObjectURL(file);

  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Could not read that image.'));
  };
  image.src = url;
});

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('Could not compress that image.'));
      return;
    }

    resolve(blob);
  }, type, quality);
});

export const compressImageFile = async (file, options = {}) => {
  if (!file || !file.type?.startsWith('image/') || SKIP_TYPES.has(file.type)) {
    return file;
  }

  const settings = { ...DEFAULT_OPTIONS, ...options };
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    settings.maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, settings.outputType, settings.quality);

  if (blob.size >= file.size) {
    return file;
  }

  return new File([blob], getImageName(file.name, settings.outputType), {
    type: settings.outputType,
    lastModified: Date.now(),
  });
};

export const imageFileToCompressedDataUrl = async (file, options = {}) => {
  const compressedFile = await compressImageFile(file, {
    maxDimension: 1200,
    quality: 0.72,
    ...options,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(compressedFile);
  });
};
