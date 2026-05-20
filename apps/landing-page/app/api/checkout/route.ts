import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/contratado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/#contato`,
  })

  return NextResponse.json({ url: session.url })
}
