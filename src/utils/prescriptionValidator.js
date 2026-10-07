function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem da receita.'));
    img.src = src;
  });
}

function toGrayscalePixels(img, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const gray = new Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
}

function averageHash(gray) {
  const avg = gray.reduce((sum, value) => sum + value, 0) / gray.length;
  return gray.map((value) => (value >= avg ? 1 : 0));
}

function differenceHash(img) {
  const width = 9;
  const height = 8;
  const gray = toGrayscalePixels(img, width, height);
  const bits = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      bits.push(gray[y * width + x] > gray[y * width + x + 1] ? 1 : 0);
    }
  }
  return bits;
}

function hammingSimilarity(a, b) {
  const len = Math.min(a.length, b.length);
  if (!len) return 0;
  let same = 0;
  for (let i = 0; i < len; i += 1) {
    if (a[i] === b[i]) same += 1;
  }
  return same / len;
}

function histogramSimilarity(imgA, imgB) {
  const size = 64;
  const histA = colorHistogram(imgA, size);
  const histB = colorHistogram(imgB, size);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < histA.length; i += 1) {
    dot += histA[i] * histB[i];
    magA += histA[i] * histA[i];
    magB += histB[i] * histB[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function colorHistogram(img, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const bins = 8;
  const hist = new Array(bins * bins * bins).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.min(bins - 1, Math.floor(data[i] / (256 / bins)));
    const g = Math.min(bins - 1, Math.floor(data[i + 1] / (256 / bins)));
    const b = Math.min(bins - 1, Math.floor(data[i + 2] / (256 / bins)));
    hist[r * bins * bins + g * bins + b] += 1;
  }
  const total = size * size;
  return hist.map((count) => count / total);
}

function decodeDataUrlText(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    if (url.startsWith('data:image/svg+xml')) {
      const comma = url.indexOf(',');
      const payload = comma >= 0 ? url.slice(comma + 1) : '';
      const decoded = decodeURIComponent(payload);
      return decoded
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase();
    }
  } catch {
    return '';
  }
  return '';
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

function textualOverlapScore(originalUrl, capturedUrl, order) {
  const originalText = decodeDataUrlText(originalUrl);
  const capturedText = decodeDataUrlText(capturedUrl);
  const originalTokens = new Set(tokenize(originalText));
  const capturedTokens = new Set(tokenize(capturedText));

  const identityHints = tokenize([
    order?.patient?.name,
    order?.patient?.susCard,
    order?.id,
    ...(order?.items || []).map((item) => item.name || item)
  ].filter(Boolean).join(' '));

  let hintHits = 0;
  identityHints.forEach((token) => {
    if (capturedText.includes(token) || capturedTokens.has(token)) hintHits += 1;
  });
  const hintScore = identityHints.length ? hintHits / identityHints.length : 0;

  if (!originalTokens.size || !capturedTokens.size) {
    return hintScore;
  }

  let intersection = 0;
  originalTokens.forEach((token) => {
    if (capturedTokens.has(token)) intersection += 1;
  });
  const union = new Set([...originalTokens, ...capturedTokens]).size;
  const jaccard = union ? intersection / union : 0;
  return Math.max(jaccard, hintScore);
}

function looksLikeInvalidDocument(url) {
  if (!url) return false;
  const haystack = `${url} ${decodeDataUrlText(url)}`.toLowerCase();
  return haystack.includes('invalid_doc') || haystack.includes('documento incompativel') || haystack.includes('documento incompatível');
}

export async function simulateCapturedPrescriptionPhoto(originalUrl) {
  const img = await loadImageElement(originalUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1f2933';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-0.035);
  ctx.filter = 'contrast(1.12) brightness(1.04) saturate(0.9)';
  ctx.drawImage(img, -290, -330, 580, 660);
  ctx.restore();

  ctx.save();
  ctx.translate(460, 150);
  ctx.rotate(-0.22);
  ctx.strokeStyle = 'rgba(227, 28, 35, 0.88)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-95, -34, 190, 68);
  ctx.fillStyle = 'rgba(227, 28, 35, 0.88)';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIA FÍSICA RETIDA', 0, -4);
  ctx.font = '11px sans-serif';
  ctx.fillText('SUS INDAIATUBA', 0, 16);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.78);
}

export async function comparePrescriptions(originalPrescriptionUrl, capturedPhotoUrl, order) {
  if (!originalPrescriptionUrl || !capturedPhotoUrl) {
    return {
      isValid: false,
      score: 0,
      statusText: 'Imagens incompletas',
      patientMatch: false,
      doctorStampMatch: false,
      medicinesMatch: false,
      message: 'Não foi possível conferir: falta a receita do pedido ou a foto recolhida pelo entregador.'
    };
  }

  if (looksLikeInvalidDocument(capturedPhotoUrl)) {
    return {
      isValid: false,
      score: 18,
      statusText: 'Documento incompatível',
      patientMatch: false,
      doctorStampMatch: false,
      medicinesMatch: false,
      message: 'A foto enviada não corresponde à receita arquivada no pedido. Divergência no documento apresentado.'
    };
  }

  try {
    const [originalImg, capturedImg] = await Promise.all([
      loadImageElement(originalPrescriptionUrl),
      loadImageElement(capturedPhotoUrl)
    ]);

    const aHashScore = hammingSimilarity(
      averageHash(toGrayscalePixels(originalImg, 16, 16)),
      averageHash(toGrayscalePixels(capturedImg, 16, 16))
    );
    const dHashScore = hammingSimilarity(differenceHash(originalImg), differenceHash(capturedImg));
    const histScore = histogramSimilarity(originalImg, capturedImg);
    const textScore = textualOverlapScore(originalPrescriptionUrl, capturedPhotoUrl, order);

    const visualScore = (aHashScore * 0.35) + (dHashScore * 0.35) + (histScore * 0.3);
    const combined = (visualScore * 0.7) + (textScore * 0.3);
    const score = Math.round(combined * 100);

    const patientMatch = textScore >= 0.35 || visualScore >= 0.72;
    const doctorStampMatch = visualScore >= 0.62 || textScore >= 0.4;
    const medicinesMatch = textScore >= 0.3 || visualScore >= 0.7;
    const isValid = score >= 62 && visualScore >= 0.55;

    return {
      isValid,
      score,
      statusText: isValid ? 'Receita autêntica e compatível' : 'Divergência na conferência',
      patientMatch,
      doctorStampMatch,
      medicinesMatch,
      message: isValid
        ? `A foto recolhida corresponde à receita do pedido ${order?.id || ''}, mesmo com variações de enquadramento, iluminação ou carimbo de coleta.`
        : 'A imagem anexada pelo entregador não apresenta similaridade suficiente com a receita digitalizada no pedido.'
    };
  } catch {
    return {
      isValid: false,
      score: 0,
      statusText: 'Falha na análise',
      patientMatch: false,
      doctorStampMatch: false,
      medicinesMatch: false,
      message: 'Não foi possível processar as imagens para conferência visual. Tente anexar a foto novamente.'
    };
  }
}
