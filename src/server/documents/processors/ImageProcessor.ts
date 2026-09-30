export async function processImage(buffer: Buffer, mimeType: string): Promise<{ text: string; base64Data: string; mimeType: string }> {
  // Vision model input preparation: base64 encoded image
  const base64 = buffer.toString('base64');
  return {
    text: '[IMAGE_DOCUMENT_BINARY]',
    base64Data: base64,
    mimeType
  };
}
