import { NextResponse } from 'next/server';
import { HermesClient } from '@pythnetwork/hermes-client';

export async function GET() {
    try {
        const connection = new HermesClient("https://hermes.pyth.network", {});
        const priceIds = [
            // You can find the ids of prices at https://pyth.network/developers/price-feed-ids
            "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744" // SUI/USD price id
          ];

        const priceUpdates = await connection.getLatestPriceUpdates(priceIds);
        const { parsed } = priceUpdates;
        if (!parsed || parsed.length === 0) {
            return NextResponse.json({ error: 'No price data found.' }, { status: 500 });
        }
        const pythData = parsed[0];
        const { price: rawPrice, conf, expo, publish_time } = pythData.price;
        const price = Number(rawPrice) * Math.pow(10, expo);
        return NextResponse.json({ price, rawPrice, conf, expo, publishTime: publish_time });

    } catch (error) {
        console.error('Error fetching SUI price:', error);
        return NextResponse.json({ error: 'Failed to fetch SUI price.' }, { status: 500 });
    }
} 