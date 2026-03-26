import React from 'react';

const BookingCard = ({ booking }: { booking: any }) => {
  return (
    <div className="bg-white shadow rounded p-3 text-sm">
      <p className="font-semibold">{booking.guest_name}</p>
      <p className="text-gray-500">{booking.check_in} - {booking.check_out}</p>
    </div>
  );
};

export default BookingCard;
