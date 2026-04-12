/** Open wa.me link from API response (POST /api/whatsapp/send). */
export function openWhatsAppFromResponse(data) {
  if (data?.waLink && typeof data.waLink === 'string') {
    window.open(data.waLink, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}
