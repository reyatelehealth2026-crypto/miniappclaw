# Requirements Document: SmartHotel PMS

## Introduction

This specification defines the requirements for SmartHotel PMS, an automated management platform for boutique hotels. The goal is to move from manual tracking to an integrated, automated system that minimizes administrative overhead.

## Requirements

### Requirement 1: Booking Management
1. THE System SHALL provide a visual grid of room availability (10-20 rooms).
2. THE System SHALL support real-time synchronization of bookings from multiple sources.
3. WHEN a booking is received, THEN THE System SHALL instantly update the availability grid.

### Requirement 2: Automated Payments
1. THE System SHALL integrate with a payment gateway (e.g., Stripe).
2. WHEN a booking is made, THEN THE System SHALL automatically send a payment request.
3. THE System SHALL track payment status (Pending, Paid, Cancelled).

### Requirement 3: Housekeeping Workflow
1. THE System SHALL allow staff to toggle room status (Clean/Dirty).
2. WHEN a guest checks out, THEN THE System SHALL automatically mark the room as "Dirty".
3. THE Dashboard SHALL visually highlight "Dirty" rooms.

### Requirement 4: Guest CRM
1. THE System SHALL store guest profiles and history.
2. THE System SHALL record specific guest preferences (e.g., room location preference).
3. THE System SHALL allow quick searching of guest history by name or phone.

### Requirement 5: Analytics
1. THE System SHALL calculate and display occupancy rates.
2. THE System SHALL provide monthly revenue reports.
3. THE System SHALL support daily rate (ADR) and Revenue Per Available Room (RevPAR) calculations.

### Requirement 6: Automated Communication
1. THE System SHALL send automated booking confirmations via messaging channels (Line/Messenger).
2. THE System SHALL send check-in reminders 24 hours prior.
3. THE System SHALL send feedback requests post-check-out.
