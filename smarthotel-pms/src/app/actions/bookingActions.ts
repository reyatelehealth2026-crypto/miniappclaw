'use server'

import { createBooking, checkAvailability } from '@/lib/bookingService';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

export async function createBookingSession(formData: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}) {
  const isAvailable = await checkAvailability(formData.roomId, formData.checkIn, formData.checkOut);
  
  if (!isAvailable) {
    throw new Error('Room is not available for these dates');
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Room Booking ${formData.roomId}`,
        },
        unit_amount: formData.totalPrice * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/cancel`,
    metadata: {
      roomId: formData.roomId,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
    },
  });

  return { sessionId: session.id };
}
