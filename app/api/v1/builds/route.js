import { NextResponse } from 'next/server';
import { saveBuild } from '../../../../lib/odm-builds';
import { decodeBuildParam } from '../../../_src/utils/builder/buildUrlCodec';
import { getItemData } from '../../../_src/utils/itemsData';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const token = body?.token;
  if (!token || typeof token !== 'string' || token.length > 2048) {
    return NextResponse.json({ error: 'invalid token' }, { status: 400 });
  }

  // Reject strings that don't decode to a build.
  const itemData = await getItemData();
  if (!decodeBuildParam(token, itemData)) {
    return NextResponse.json({ error: 'invalid build' }, { status: 400 });
  }

  const id = saveBuild(token);
  return NextResponse.json({ id, url: '/odm/b/' + id });
}
