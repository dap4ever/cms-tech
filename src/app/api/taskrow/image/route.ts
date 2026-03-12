import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const host = process.env.TASKROW_HOST || '';
  const token = process.env.TASKROW_TOKEN || '';
  
  if (!host || !token) {
    return new NextResponse('Missing credentials', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const identification = searchParams.get('identification');
  const mimeType = searchParams.get('mimeType') || 'image/png';
  const time = searchParams.get('time') || '';

  if (!identification) {
    return new NextResponse('Missing identification', { status: 400 });
  }

  try {
    const download = searchParams.get('download') === '1';
    const imageUrl = `https://${host}/File/TaskImageByGuid/?identification=${identification}&mimeType=${encodeURIComponent(mimeType)}${time ? `&time=${time}` : ''}`;
    
    const imgRes = await fetch(imageUrl, {
      headers: { '__identifier': token }
    });

    if (!imgRes.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imageBuffer = await imgRes.arrayBuffer();
    
    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    };

    if (download) {
      const filename = `image.${mimeType.split('/')[1] || 'png'}`;
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(imageBuffer, { status: 200, headers });
  } catch (e: any) {
    return new NextResponse(`Error: ${e.message}`, { status: 500 });
  }
}
