import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { buffer } from 'micro'
import { client as sanityClient } from '@/lib/sanity'
import { Resend } from 'resend'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  console.log('📦 Stripe webhook received')

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
    console.error('❌ Webhook Error:', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const customerEmail = session.customer_details?.email || session.customer_email || 'unknown@example.com'

    const lineItems = [
      { name: 'Placeholder Product', price: 10.0 }
    ]

    await sanityClient.create({
      _type: 'order',
      stripeSessionId: session.id,
      customerEmail,
      items: lineItems,
      createdAt: new Date().toISOString(),
    })

    await resend.emails.send({
      from: 'support@dysanum.com',
      to: process.env.ORDER_NOTIFY_EMAIL,
      subject: '🛒 New Order Received',
      html: `<strong>New order from ${customerEmail}</strong>`,
    })

    await resend.emails.send({
      from: 'support@dysanum.com',
      to: customerEmail,
      subject: 'Your Dysanum Order Confirmation',
      html: `<strong>Thank you for your order!</strong>`,
    })
  }

  return NextResponse.json({ received: true })
}
