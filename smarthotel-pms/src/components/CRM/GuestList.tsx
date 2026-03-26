'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGuests() {
      const { data, error } = await supabase.from('guests').select('*');
      if (error) {
        console.error('Error fetching guests:', error);
      } else {
        setGuests(data || []);
      }
      setLoading(false);
    }
    fetchGuests();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Guest List</h2>
      <ul>
        {guests.map((guest) => (
          <li key={guest.id} className="border-b py-2">
            <p className="font-semibold">{guest.name}</p>
            <p className="text-sm text-gray-500">{guest.email} | {guest.phone}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
