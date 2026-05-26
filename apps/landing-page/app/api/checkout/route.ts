import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PRICE_ENV: Record<string, string> = {
  Mensal: 'STRIPE_PRICE_ID_MONTHLY',
  Trimestral: 'STRIPE_PRICE_ID_QUARTERLY',
  Anual: 'STRIPE_PRICE_ID_YEARLY',
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({})) as { period?: string }
  const period = body?.period ?? 'Mensal'

  const envVar = PRICE_ENV[period]
  if (!envVar) {
    return NextResponse.json({ error: `Unknown plan period: "${period}"` }, { status: 400 })
  }

  const priceId = process.env[envVar]
  if (!priceId) {
    return NextResponse.json(
      { error: `${envVar} not configured` },
      { status: 500 },
    )
  }

  const stripe = new Stripe(secretKey)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/contratado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#contato`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Stripe session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
