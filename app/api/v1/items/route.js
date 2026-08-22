import { NextResponse } from 'next/server';
import { getItemData } from '../../../_src/utils/itemsData';

// Single-item lookup for the build-card hover preview:
//   /api/v1/items?name=...&type=charm&power=3
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const power = searchParams.get('power');
    if (!name) {
        return NextResponse.json({ error: 'missing name' }, { status: 400 });
    }

    const itemData = await getItemData();
    let item = null;
    if (type === 'charm') {
        const wantedPower = power != null ? Number(power) : null;
        item =
            Object.values(itemData).find(
                (i) => i.name === name && i.type === 'Charm' && (wantedPower == null || Number(i.power) === wantedPower)
            ) || null;
    } else {
        item = itemData[name] || Object.values(itemData).find((i) => i.name === name) || null;
    }
    return NextResponse.json({ item });
}
