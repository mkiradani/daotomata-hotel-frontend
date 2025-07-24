#!/usr/bin/env node

import { createDirectus, rest, readItems } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config();

const directus = createDirectus(process.env.DIRECTUS_URL).with(rest());

async function checkData() {
  try {
    console.log('🔍 Checking transportation data for hotel_id: 2');
    const transportation = await directus.request(
      readItems('transportation', {
        filter: { hotel_id: { _eq: 2 } },
      })
    );
    console.log('Transportation records:', transportation.length);

    console.log('🔍 Checking local_places data for hotel_id: 2');
    const localPlaces = await directus.request(
      readItems('local_places', {
        filter: { hotel_id: { _eq: 2 } },
      })
    );
    console.log('Local places records:', localPlaces.length);

    if (transportation.length > 0) {
      console.log('✅ Transportation data exists');
      console.log('First record:', transportation[0]);
    } else {
      console.log('❌ No transportation data found');
    }

    if (localPlaces.length > 0) {
      console.log('✅ Local places data exists');
      console.log('First record:', localPlaces[0]);
    } else {
      console.log('❌ No local places data found');
    }
  } catch (error) {
    console.error('Error checking data:', error.message);
  }
}

checkData();
