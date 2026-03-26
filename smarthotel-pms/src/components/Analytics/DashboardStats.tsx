'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Stats {
  revenue: number;
  occupancy: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({ revenue: 0, occupancy: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data: bookings, error: bError } = await supabase.from('bookings').select('total_price, status');
      const { data: rooms, error: rError } = await supabase.from('rooms').select('id');

      if (bError || rError) {
        console.error('Error fetching stats:', bError || rError);
        return;
      }

      const totalRevenue = bookings?.reduce((acc, booking) => acc + (booking.total_price || 0), 0) || 0;
      const occupiedRooms = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const totalRooms = rooms?.length || 0;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      setStats({ revenue: totalRevenue, occupancy: occupancyRate });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-white shadow rounded">
        <h3 className="text-gray-500">Total Revenue</h3>
        <p className="text-2xl font-bold">${stats.revenue.toFixed(2)}</p>
      </div>
      <div className="p-4 bg-white shadow rounded">
        <h3 className="text-gray-500">Occupancy Rate</h3>
        <p className="text-2xl font-bold">{stats.occupancy.toFixed(1)}%</p>
      </div>
    </div>
  );
}
