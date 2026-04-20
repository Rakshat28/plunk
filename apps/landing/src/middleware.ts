import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function acceptsMarkdown(accept: string): boolean {
  for (const part of accept.split(',')) {
    const segments = part.trim().split(';');
    if (segments[0]?.trim().toLowerCase() !== 'text/markdown') continue;
    const qParam = segments.slice(1).find(s => s.trim().startsWith('q='));
    const q = qParam ? parseFloat((qParam.split('=')[1]) ?? '1') : 1;
    return !isNaN(q) && q > 0;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept') ?? '';
  const { pathname } = request.nextUrl;

  if (acceptsMarkdown(accept)) {
    const headers = new Headers(request.headers);
    headers.set('x-md-path', pathname);
    const response = NextResponse.rewrite(new URL('/api/md', request.url), { request: { headers } });
    response.headers.set('Vary', 'Accept');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Vary', 'Accept');
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|favicon\\.ico|assets|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|css|js)).*)',],
};
