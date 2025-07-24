#!/usr/bin/env node

/**
 * Script to add sample data for Baberrih Hotel (ID: 2) to Directus
 * This ensures the guest directory pages have content to display
 */

import { createDirectus, rest, createItem } from '@directus/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const directus = createDirectus(process.env.DIRECTUS_URL).with(rest());

// Transportation data for Baberrih Hotel
const transportationData = [
  {
    hotel_id: 2,
    name: 'Grand Taxi Essaouira',
    description:
      'Shared or private taxi service connecting Essaouira to major cities like Marrakech and Casablanca. Comfortable and reliable transportation option.',
    transport_type: 'taxi',
    estimated_cost: '200-400 MAD to Marrakech',
    travel_time_to_downtown: 15,
    travel_time_to_airport: 20,
    operating_hours: {
      mon: { open: '06:00', close: '22:00' },
      tue: { open: '06:00', close: '22:00' },
      wed: { open: '06:00', close: '22:00' },
      thu: { open: '06:00', close: '22:00' },
      fri: { open: '06:00', close: '22:00' },
      sat: { open: '06:00', close: '22:00' },
      sun: { open: '07:00', close: '21:00' },
    },
    booking_required: false,
    pickup_location: 'Hotel pickup available',
  },
  {
    hotel_id: 2,
    name: 'Petit Taxi Local',
    description:
      'Local taxis for short trips within Essaouira city. Metered service for convenient urban transport to medina, port, and beaches.',
    transport_type: 'taxi',
    estimated_cost: '10-30 MAD within city',
    travel_time_to_downtown: 8,
    travel_time_to_airport: 15,
    operating_hours: {
      mon: { open: '06:00', close: '01:00' },
      tue: { open: '06:00', close: '01:00' },
      wed: { open: '06:00', close: '01:00' },
      thu: { open: '06:00', close: '01:00' },
      fri: { open: '06:00', close: '01:00' },
      sat: { open: '06:00', close: '01:00' },
      sun: { open: '06:00', close: '01:00' },
    },
    booking_required: false,
    pickup_location: 'Street hail or hotel call',
  },
  {
    hotel_id: 2,
    name: 'Car Rental - Hertz Essaouira',
    description:
      'International car rental service with economy cars, SUVs, and 4x4 vehicles. Perfect for exploring the Atlantic coast and Atlas mountains.',
    transport_type: 'rental',
    estimated_cost: '300-600 MAD per day',
    travel_time_to_downtown: 10,
    travel_time_to_airport: 18,
    operating_hours: {
      mon: { open: '08:00', close: '19:00' },
      tue: { open: '08:00', close: '19:00' },
      wed: { open: '08:00', close: '19:00' },
      thu: { open: '08:00', close: '19:00' },
      fri: { open: '08:00', close: '19:00' },
      sat: { open: '08:00', close: '18:00' },
      sun: { open: '09:00', close: '17:00' },
    },
    booking_required: true,
    pickup_location: 'Hotel delivery available',
  },
];

// Local places (attractions) data for Baberrih Hotel
const localPlacesData = [
  {
    hotel_id: 2,
    name: 'Essaouira Medina',
    description:
      'UNESCO World Heritage site featuring traditional Moroccan architecture, bustling souks, and historic ramparts. A must-visit cultural landmark.',
    category: 'culture',
    address: 'Medina, Essaouira, Morocco',
    distance_from_hotel: 2500,
    opening_hours: {
      mon: { open: '08:00', close: '20:00' },
      tue: { open: '08:00', close: '20:00' },
      wed: { open: '08:00', close: '20:00' },
      thu: { open: '08:00', close: '20:00' },
      fri: { open: '08:00', close: '20:00' },
      sat: { open: '08:00', close: '20:00' },
      sun: { open: '08:00', close: '20:00' },
    },
    price_range: 'free',
    tags: ['historic', 'unesco', 'shopping', 'culture', 'architecture'],
  },
  {
    hotel_id: 2,
    name: 'Skala de la Kasbah',
    description:
      'Historic sea bastion with ancient cannons and panoramic views of the Atlantic Ocean. Perfect for sunset photography and maritime history.',
    category: 'viewpoints',
    address: 'Place Moulay Hassan, Essaouira, Morocco',
    distance_from_hotel: 2800,
    opening_hours: {
      mon: { open: '09:00', close: '18:00' },
      tue: { open: '09:00', close: '18:00' },
      wed: { open: '09:00', close: '18:00' },
      thu: { open: '09:00', close: '18:00' },
      fri: { open: '09:00', close: '18:00' },
      sat: { open: '09:00', close: '18:00' },
      sun: { open: '09:00', close: '18:00' },
    },
    price_range: 'budget',
    tags: ['historic', 'views', 'photography', 'sunset', 'atlantic'],
  },
  {
    hotel_id: 2,
    name: 'Essaouira Beach',
    description:
      'Wide sandy beach perfect for walks, kitesurfing, and watching local fishermen. Popular with surfers and known for constant Atlantic winds.',
    category: 'nature',
    address: 'Essaouira Beach, Morocco',
    distance_from_hotel: 1800,
    price_range: 'free',
    tags: ['beach', 'surfing', 'walking', 'sunset', 'nature', 'kitesurfing'],
  },
  {
    hotel_id: 2,
    name: 'Port of Essaouira',
    description:
      'Working fishing port where you can watch the daily catch being brought in and buy fresh seafood. Authentic local experience.',
    category: 'culture',
    address: "Port d'Essaouira, Morocco",
    distance_from_hotel: 2200,
    opening_hours: {
      mon: { open: '06:00', close: '19:00' },
      tue: { open: '06:00', close: '19:00' },
      wed: { open: '06:00', close: '19:00' },
      thu: { open: '06:00', close: '19:00' },
      fri: { open: '06:00', close: '19:00' },
      sat: { open: '06:00', close: '19:00' },
      sun: { open: '06:00', close: '19:00' },
    },
    price_range: 'free',
    tags: ['fishing', 'local-life', 'seafood', 'authentic', 'port'],
  },
];

async function addBaberirHotelData() {
  try {
    console.log('🏨 Adding sample data for Baberrih Hotel (ID: 2)...');

    // Add transportation data
    console.log('🚗 Adding transportation options...');
    for (const transport of transportationData) {
      try {
        const result = await directus.request(
          createItem('transportation', transport)
        );
        console.log(`✅ Added: ${transport.name} (ID: ${result.id})`);
      } catch (error) {
        console.log(`❌ Error adding ${transport.name}: ${error.message}`);
        console.log('Full error:', error);
      }
    }

    // Add local places data
    console.log('📍 Adding local attractions...');
    for (const place of localPlacesData) {
      try {
        const result = await directus.request(
          createItem('local_places', place)
        );
        console.log(`✅ Added: ${place.name} (ID: ${result.id})`);
      } catch (error) {
        console.log(`❌ Error adding ${place.name}: ${error.message}`);
        console.log('Full error:', error);
      }
    }

    console.log('🎉 Sample data addition completed!');
    console.log('📋 Summary:');
    console.log(`   - Transportation options: ${transportationData.length}`);
    console.log(`   - Local attractions: ${localPlacesData.length}`);
    console.log('');
    console.log('🔗 Now test the guest directory pages:');
    console.log('   - /guest-directory/transportation');
    console.log('   - /guest-directory/attractions');
  } catch (error) {
    console.error('❌ Error adding data:', error);
    process.exit(1);
  }
}

// Run the script
addBaberirHotelData();
