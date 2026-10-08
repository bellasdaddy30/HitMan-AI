import Stripe from 'stripe';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { email, credits, priceId } = await req.json();

  if (!email || !credits || !priceId) {
    return Response.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const origin = req.headers.get('origin') || 'https://hitman-ai.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?credits=${credits}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/studio`,
      metadata: { credits: String(credits), email },
    });

    return Response.json({ url: session.url });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[checkout]', e?.message);
    return Response.json({ error: 'Could not create checkout session.' }, { status: 500 });
  }
}
