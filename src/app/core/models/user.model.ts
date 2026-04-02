/**
 * User Model - Represents the authenticated user
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  roles: Role[];
  permissions: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  clinicaId?: number;
  rolId?: number;
  rolName?: string;
}

/**
 * Role Model - User roles for authorization
 */
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
}

/**
 * User Profile - Extended user information
 */
export interface UserProfile extends User {
  address?: Address;
  preferences?: UserPreferences;
}

/**
 * Address Model
 */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * User Preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  direction: 'ltr' | 'rtl';
  notifications: boolean;
}

/**
 * Create User DTO
 */
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: number[];
}

/**
 * Update User DTO
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  roleIds?: number[];
}
