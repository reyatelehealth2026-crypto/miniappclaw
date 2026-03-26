'use client'

import { useState } from 'react';
import { createBookingSession } from '@/app/actions/bookingActions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function AvailabilityCalendar({ roomId, pricePerNight }: { roomId: string, pricePerNight: number }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    setLoading(true);
    try {
      const { sessionId } = await createBookingSession({
        roomId,
        checkIn,
        checkOut,
        totalPrice: pricePerNight * 1, // simplified
      });
      
      const stripe = await stripePromise;
      if (stripe) {
        await (stripe as any).redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error(error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <input type="date" onChange={(e) => setCheckIn(e.target.value)} />
      <input type="date" onChange={(e) => setCheckOut(e.target.value)} />
      <button onClick={handleBooking} disabled={loading}>
        {loading ? 'Booking...' : 'Book Now'}
      </button>
    </div>
  );
}
