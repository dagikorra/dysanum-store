import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
})

// Helper: Read the raw body from ReadableStream
async function getRawBody(readableStream) {
  const reader = readableStream.getReader()
  const chunks = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  return Buffer.concat(chunks)
}

export async function POST(req) {
  const rawBody = await getRawBody(req.body)
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

  console.log('✅ Webhook verified:', event.type)

  // Example: You can add logic here for session completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    console.log('✅ Payment successful:', session)
  }

  return NextResponse.json({ received: true })
}
