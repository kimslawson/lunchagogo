import type { Tables, Fn } from '$lib/database.types';

export type Profile = Tables<'profiles'>;
export type Truck = Tables<'trucks'>;
export type TruckLocation = Tables<'truck_locations'>;
export type MenuItem = Tables<'menu_items'>;
export type Special = Tables<'specials'>;
export type TruckHours = Tables<'truck_hours'>;
export type Follow = Tables<'follows'>;
export type Checkin = Tables<'checkins'>;

export type NearbyTruck = Fn<'nearby_trucks'>[number];
export type FeedItem = Fn<'get_following_feed'>[number];
export type Patron = Fn<'get_truck_patrons'>[number];

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
