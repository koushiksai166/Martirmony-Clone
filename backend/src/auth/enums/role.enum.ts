/**
 * ============================================================================
 * ROLE ENUM (User Access Levels)
 * ============================================================================
 * Defines system access tiers for Role-Based Access Control (RBAC).
 *
 * Values:
 * - USER: Standard member who creates a matrimony profile, searches for matches,
 *         and communicates with other candidates.
 * - ADMIN: Platform moderator with elevated privileges to verify profiles, resolve
 *          flagged reports, and delete fraudulent accounts.
 * ============================================================================
 */

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}