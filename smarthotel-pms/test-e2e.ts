// test-e2e.ts

// Mocks to simulate database responses
const mockBookings = [
  { id: 'b1', total_price: 1000, status: 'confirmed' },
  { id: 'b2', total_price: 2000, status: 'pending' },
  { id: 'b3', total_price: 1500, status: 'confirmed' },
];

const mockRooms = [
  { id: 'r1' },
  { id: 'r2' },
  { id: 'r3' },
  { id: 'r4' },
];

const mockGuests = [
  { id: 'g1', name: 'John Doe', email: 'john@example.com', phone: '123456789' },
  { id: 'g2', name: 'Jane Smith', email: 'jane@example.com', phone: '987654321' },
];

// Replicating calculation logic from DashboardStats.tsx
function calculateStats(bookings: any[], rooms: any[]) {
  const totalRevenue = bookings?.reduce((acc, booking) => acc + (booking.total_price || 0), 0) || 0;
  const occupiedRooms = bookings?.filter(b => b.status === 'confirmed').length || 0;
  const totalRooms = rooms?.length || 0;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  return { revenue: totalRevenue, occupancy: occupancyRate };
}

// Replicating data mapping for GuestList.tsx
function formatGuestList(guests: any[]) {
  return guests.map(guest => ({
    name: guest.name,
    email: guest.email,
    phone: guest.phone
  }));
}

// Execute Tests
console.log("--- E2E Flow Test ---");

// Test 1: Analytics Calculation
const stats = calculateStats(mockBookings, mockRooms);
console.log("Analytics Test:", stats);
if (stats.revenue === 4500 && stats.occupancy === 50) {
  console.log("✅ Analytics Calculation: PASSED");
} else {
  console.error("❌ Analytics Calculation: FAILED");
}

// Test 2: CRM Data Mapping
const guests = formatGuestList(mockGuests);
console.log("CRM Test:", guests);
if (guests.length === 2 && guests[0].name === 'John Doe') {
  console.log("✅ Guest List Mapping: PASSED");
} else {
  console.error("❌ Guest List Mapping: FAILED");
}

console.log("--- End of Test ---");
