import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function checkAvailability(roomId: string, checkIn: string, checkOut: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('room_id', roomId)
    .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`);

  if (error) throw error;
  
  // If data is empty or filtered, the room is available
  return data.length === 0;
}

export async function createBooking(bookingData: {
  room_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
}) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select();

  if (error) throw error;
  return data;
}
