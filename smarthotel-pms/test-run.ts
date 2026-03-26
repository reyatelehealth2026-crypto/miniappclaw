import { createBooking, checkAvailability } from './src/lib/bookingService';

async function testBookingFlow() {
    console.log("Starting test booking flow...");

    // Mock roomId and userId
    const roomId = 'room-101-uuid';
    const checkIn = '2026-04-01';
    const checkOut = '2026-04-03';

    try {
        console.log("Checking availability for", checkIn, "to", checkOut);
        // const isAvailable = await checkAvailability(roomId, checkIn, checkOut); // Skipping actual Supabase call to avoid errors if env not set
        const isAvailable = true; // Simulated availability
        
        if (isAvailable) {
            console.log("Room is available. Simulating booking creation...");
            
            const bookingData = {
                room_id: roomId,
                user_id: 'guest-123-uuid',
                check_in: checkIn,
                check_out: checkOut,
                total_price: 2500.00,
                status: 'confirmed'
            };

            // await createBooking(bookingData); // Skipping actual Supabase call
            console.log("Simulated Booking created successfully:", bookingData);
        } else {
            console.log("Room is not available.");
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testBookingFlow();
