import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const resend = new Resend(process.env.RESEND_API_KEY)

export const config = {
  api: {
    bodyParser: false,
  },
}

async function getRawBody(readable) {
  const reader = readable.getReader()
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const customerEmail = session.customer_details?.email || 'Unknown'

    // 🔔 Send email to support
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: 'support@dysanum.com',
      subject: '🛒 New Order Received',
      html: `<p>New order from ${customerEmail}</p>
             <p>Stripe Session ID: ${session.id}</p>`,
    })

    // 📤 Optional: Send confirmation to buyer
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: customerEmail,
      subject: '✅ Order Confirmation – Dysanum Store',
      html: `<p>Thank you for your order!</p>
             <p>Your order has been received and is being processed.</p>`,
    })

    console.log('✅ Emails sent to customer and admin')
  }

  return NextResponse.json({ received: true })
}
