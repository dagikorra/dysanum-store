import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { client as sanityClient } from '@/lib/sanity'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  const rawBody = await req.text()
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
    const customerEmail = session.customer_details?.email || session.customer_email || 'unknown@dysanum.com'

    // TEMP placeholder until dynamic items are passed from checkout
    const lineItems = [
      { name: 'Placeholder Item', price: 10.0 }
    ]

    // Save order in Sanity
    await sanityClient.create({
      _type: 'order',
      stripeSessionId: session.id,
      customerEmail,
      items: lineItems,
      createdAt: new Date().toISOString(),
    })

    // Email you
    await resend.emails.send({
      from: 'support@dysanum.com',
      to: process.env.ORDER_NOTIFY_EMAIL,
      subject: '🛒 New Order Received',
      html: `<strong>New order from ${customerEmail}</strong>`,
    })

    // Email customer
    await resend.emails.send({
      from: 'support@dysanum.com',
      to: customerEmail,
      subject: 'Your Dysanum Order Confirmation',
      html: `<strong>Thank you for your order!</strong>`,
    })
  }

  return NextResponse.json({ received: true })
}
