// Email links must also work when opened on another device.
export function authRedirectUrl() {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://svampatlas.vercel.app');
  return new URL('/auth/confirm', origin).toString();
}
