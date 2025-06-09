import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const config = {
  api: {
    bodyParser: false, // 👈 Required for raw body
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export async function POST(req) {
  const rawBody = await buffer(req.body)
  const sig = req.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // ✅ Handle completed checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    console.log('✅ Payment confirmed:', session)

    // TODO: Save to Sanity + Send email
  }

  return NextResponse.json({ received: true })
}
