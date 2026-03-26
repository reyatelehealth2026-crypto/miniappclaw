import React from 'react';
import BookingCard from './BookingCard';

const RoomGrid = ({ rooms, bookings }: { rooms: any[], bookings: any[] }) => {
  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      {rooms.map((room) => (
        <div key={room.id} className="border rounded p-4 h-48 bg-gray-50">
          <h3 className="font-bold text-lg mb-2">Room {room.room_number}</h3>
          {bookings
            .filter((b) => b.room_id === room.id)
            .map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
        </div>
      ))}
    </div>
  );
};

export default RoomGrid;
