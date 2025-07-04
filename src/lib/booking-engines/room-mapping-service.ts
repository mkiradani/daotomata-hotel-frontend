/**
 * Room Mapping Service - Maps Directus rooms to Cloudbeds rooms by name
 */

import type { RoomAvailability, RoomRate } from './types';

export interface DirectusRoom {
  id: string;
  name: string;
  room_type: string;
  max_occupancy: number;
  size_sqm?: number;
  base_price?: string;
  pms_room_id?: string;
  [key: string]: unknown;
}

export interface CloudbedsRoom {
  id: string;
  name: string;
  type: string;
  max_occupancy: number;
  available: boolean;
  price: number;
  currency: string;
  [key: string]: unknown;
}

export interface MappedRoom {
  directusId: string;
  cloudbedsId: string;
  name: string;
  roomType: string;
  maxOccupancy: number;
  sizeSqm?: number;
  basePrice?: string;
  available: boolean;
  currentPrice: number;
  currency: string;
  cloudbedsData: CloudbedsRoom;
  directusData: DirectusRoom;
}

export class RoomMappingService {
  /**
   * Map Directus rooms to Cloudbeds rooms by name
   */
  static mapRoomsByName(
    directusRooms: DirectusRoom[],
    cloudbedsRooms: CloudbedsRoom[],
  ): MappedRoom[] {
    const mappedRooms: MappedRoom[] = [];

    for (const directusRoom of directusRooms) {
      // Find matching Cloudbeds room by name (case-insensitive)
      const cloudbedsRoom = cloudbedsRooms.find(
        (cbRoom) =>
          this.normalizeRoomName(cbRoom.name) === this.normalizeRoomName(directusRoom.name),
      );

      if (cloudbedsRoom) {
        mappedRooms.push({
          directusId: directusRoom.id,
          cloudbedsId: cloudbedsRoom.id,
          name: directusRoom.name, // Use Directus name as primary
          roomType: directusRoom.room_type,
          maxOccupancy: directusRoom.max_occupancy,
          sizeSqm: directusRoom.size_sqm,
          basePrice: directusRoom.base_price,
          available: cloudbedsRoom.available,
          currentPrice: cloudbedsRoom.price,
          currency: cloudbedsRoom.currency,
          cloudbedsData: cloudbedsRoom,
          directusData: directusRoom,
        });
      } else {
        // Log unmapped rooms for debugging
        console.warn(`No Cloudbeds room found for Directus room: ${directusRoom.name}`);
      }
    }

    return mappedRooms;
  }

  /**
   * Map availability data with Directus room information
   */
  static mapAvailabilityWithDirectusRooms(
    availability: RoomAvailability[],
    directusRooms: DirectusRoom[],
  ): Array<RoomAvailability & { directusRoom?: DirectusRoom }> {
    return availability.map((avail) => {
      const directusRoom = directusRooms.find(
        (room) =>
          this.normalizeRoomName(room.name) === this.normalizeRoomName(avail.roomType) ||
          room.pms_room_id === avail.roomId,
      );

      return {
        ...avail,
        directusRoom,
      };
    });
  }

  /**
   * Map rates data with Directus room information
   */
  static mapRatesWithDirectusRooms(
    rates: RoomRate[],
    directusRooms: DirectusRoom[],
  ): Array<RoomRate & { directusRoom?: DirectusRoom }> {
    return rates.map((rate) => {
      const directusRoom = directusRooms.find(
        (room) =>
          this.normalizeRoomName(room.name) === this.normalizeRoomName(rate.roomType) ||
          room.pms_room_id === rate.roomId,
      );

      return {
        ...rate,
        directusRoom,
      };
    });
  }

  /**
   * Update Directus rooms with Cloudbeds room IDs
   */
  static updateDirectusRoomsWithCloudbedsIds(
    directusRooms: DirectusRoom[],
    cloudbedsRooms: CloudbedsRoom[],
  ): Array<DirectusRoom & { suggested_pms_room_id?: string }> {
    return directusRooms.map((directusRoom) => {
      const cloudbedsRoom = cloudbedsRooms.find(
        (cbRoom) =>
          this.normalizeRoomName(cbRoom.name) === this.normalizeRoomName(directusRoom.name),
      );

      if (cloudbedsRoom && !directusRoom.pms_room_id) {
        return {
          ...directusRoom,
          suggested_pms_room_id: cloudbedsRoom.id,
        };
      }

      return directusRoom;
    });
  }

  /**
   * Get room mapping statistics
   */
  static getMappingStats(
    directusRooms: DirectusRoom[],
    cloudbedsRooms: CloudbedsRoom[],
  ): {
    totalDirectusRooms: number;
    totalCloudbedsRooms: number;
    mappedRooms: number;
    unmappedDirectusRooms: string[];
    unmappedCloudbedsRooms: string[];
  } {
    const mappedRooms = this.mapRoomsByName(directusRooms, cloudbedsRooms);
    const mappedDirectusIds = mappedRooms.map((r) => r.directusId);
    const mappedCloudbedsIds = mappedRooms.map((r) => r.cloudbedsId);

    const unmappedDirectusRooms = directusRooms
      .filter((room) => !mappedDirectusIds.includes(room.id))
      .map((room) => room.name);

    const unmappedCloudbedsRooms = cloudbedsRooms
      .filter((room) => !mappedCloudbedsIds.includes(room.id))
      .map((room) => room.name);

    return {
      totalDirectusRooms: directusRooms.length,
      totalCloudbedsRooms: cloudbedsRooms.length,
      mappedRooms: mappedRooms.length,
      unmappedDirectusRooms,
      unmappedCloudbedsRooms,
    };
  }

  /**
   * Normalize room name for comparison
   */
  private static normalizeRoomName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\b(room|habitacion|chambre|zimmer)\b/g, '') // Remove common room words
      .trim();
  }

  /**
   * Find best match for a room name using fuzzy matching
   */
  static findBestRoomMatch(
    targetName: string,
    candidateRooms: { id: string; name: string }[],
  ): { room: { id: string; name: string }; confidence: number } | null {
    const normalizedTarget = this.normalizeRoomName(targetName);

    let bestMatch: { room: { id: string; name: string }; confidence: number } | null = null;

    for (const candidate of candidateRooms) {
      const normalizedCandidate = this.normalizeRoomName(candidate.name);
      const confidence = this.calculateSimilarity(normalizedTarget, normalizedCandidate);

      if (confidence > 0.8 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { room: candidate, confidence };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Simple similarity calculation based on common characters
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Validate room mapping configuration
   */
  static validateRoomMapping(
    directusRooms: DirectusRoom[],
    cloudbedsRooms: CloudbedsRoom[],
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate room names in Directus
    const directusNames = directusRooms.map((r) => this.normalizeRoomName(r.name));
    const duplicateDirectusNames = directusNames.filter(
      (name, index) => directusNames.indexOf(name) !== index,
    );
    if (duplicateDirectusNames.length > 0) {
      errors.push(`Duplicate room names in Directus: ${duplicateDirectusNames.join(', ')}`);
    }

    // Check for duplicate room names in Cloudbeds
    const cloudbedsNames = cloudbedsRooms.map((r) => this.normalizeRoomName(r.name));
    const duplicateCloudbedsNames = cloudbedsNames.filter(
      (name, index) => cloudbedsNames.indexOf(name) !== index,
    );
    if (duplicateCloudbedsNames.length > 0) {
      errors.push(`Duplicate room names in Cloudbeds: ${duplicateCloudbedsNames.join(', ')}`);
    }

    // Check mapping coverage
    const stats = this.getMappingStats(directusRooms, cloudbedsRooms);
    if (stats.mappedRooms === 0) {
      errors.push('No rooms could be mapped between Directus and Cloudbeds');
    } else if (stats.mappedRooms < stats.totalDirectusRooms) {
      warnings.push(
        `${stats.unmappedDirectusRooms.length} Directus rooms could not be mapped: ${stats.unmappedDirectusRooms.join(', ')}`,
      );
    }

    if (stats.unmappedCloudbedsRooms.length > 0) {
      warnings.push(
        `${stats.unmappedCloudbedsRooms.length} Cloudbeds rooms are not mapped: ${stats.unmappedCloudbedsRooms.join(', ')}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
