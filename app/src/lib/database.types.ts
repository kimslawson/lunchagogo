// Hand-written to mirror supabase/migrations/0001_init.sql.
// Regenerate anytime with:  supabase gen types typescript --local > src/lib/database.types.ts
export type UserRole = 'foodie' | 'truck';

type Timestamps = { created_at: string };

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					role: UserRole;
					display_name: string;
					avatar_url: string | null;
					home_zip: string | null;
					phone: string | null;
					push_opt_in: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					role?: UserRole;
					display_name?: string;
					avatar_url?: string | null;
					home_zip?: string | null;
					phone?: string | null;
					push_opt_in?: boolean;
				};
				Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
				Relationships: [];
			};
			trucks: {
				Row: {
					id: string;
					owner_id: string;
					name: string;
					slug: string;
					bio: string | null;
					cuisine: string | null;
					logo_url: string | null;
					phone: string | null;
					website: string | null;
					instagram: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					owner_id: string;
					name: string;
					slug: string;
					bio?: string | null;
					cuisine?: string | null;
					logo_url?: string | null;
					phone?: string | null;
					website?: string | null;
					instagram?: string | null;
				};
				Update: Partial<Database['public']['Tables']['trucks']['Insert']>;
				Relationships: [];
			};
			truck_locations: {
				Row: {
					id: string;
					truck_id: string;
					label: string | null;
					address: string | null;
					lat: number | null;
					lng: number | null;
					is_live: boolean;
					starts_at: string | null;
					ends_at: string | null;
					created_at: string;
				};
				Insert: {
					truck_id: string;
					label?: string | null;
					address?: string | null;
					lat?: number | null;
					lng?: number | null;
					is_live?: boolean;
					starts_at?: string | null;
					ends_at?: string | null;
				};
				Update: Partial<Database['public']['Tables']['truck_locations']['Insert']>;
				Relationships: [];
			};
			menu_items: {
				Row: {
					id: string;
					truck_id: string;
					section: string;
					name: string;
					description: string | null;
					price: number | null;
					is_available: boolean;
					sort_order: number;
					created_at: string;
				};
				Insert: {
					truck_id: string;
					section?: string;
					name: string;
					description?: string | null;
					price?: number | null;
					is_available?: boolean;
					sort_order?: number;
				};
				Update: Partial<Database['public']['Tables']['menu_items']['Insert']>;
				Relationships: [];
			};
			specials: {
				Row: {
					id: string;
					truck_id: string;
					title: string;
					description: string | null;
					price: number | null;
					photo_url: string | null;
					active_until: string | null;
					created_at: string;
				};
				Insert: {
					truck_id: string;
					title: string;
					description?: string | null;
					price?: number | null;
					photo_url?: string | null;
					active_until?: string | null;
				};
				Update: Partial<Database['public']['Tables']['specials']['Insert']>;
				Relationships: [];
			};
			truck_hours: {
				Row: {
					id: string;
					truck_id: string;
					day_of_week: number;
					open_time: string | null;
					close_time: string | null;
					is_closed: boolean;
				};
				Insert: {
					truck_id: string;
					day_of_week: number;
					open_time?: string | null;
					close_time?: string | null;
					is_closed?: boolean;
				};
				Update: Partial<Database['public']['Tables']['truck_hours']['Insert']>;
				Relationships: [];
			};
			follows: {
				Row: {
					id: string;
					foodie_id: string;
					truck_id: string;
					notify: boolean;
					created_at: string;
				};
				Insert: { foodie_id: string; truck_id: string; notify?: boolean };
				Update: Partial<Database['public']['Tables']['follows']['Insert']>;
				Relationships: [];
			};
			checkins: {
				Row: {
					id: string;
					foodie_id: string;
					truck_id: string;
					actor_name: string;
					actor_avatar: string | null;
					photo_url: string | null;
					caption: string | null;
					lat: number | null;
					lng: number | null;
					created_at: string;
				};
				Insert: {
					foodie_id: string;
					truck_id: string;
					actor_name: string;
					actor_avatar?: string | null;
					photo_url?: string | null;
					caption?: string | null;
					lat?: number | null;
					lng?: number | null;
				};
				Update: Partial<Database['public']['Tables']['checkins']['Insert']>;
				Relationships: [];
			};
			push_subscriptions: {
				Row: {
					id: string;
					user_id: string;
					endpoint: string;
					p256dh: string;
					auth: string;
					created_at: string;
				};
				Insert: { user_id: string; endpoint: string; p256dh: string; auth: string };
				Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>;
				Relationships: [];
			};
		};
		Views: { [_ in never]: never };
		CompositeTypes: { [_ in never]: never };
		Functions: {
			nearby_trucks: {
				Args: { p_lat: number; p_lng: number; p_radius_m?: number; p_limit?: number };
				Returns: {
					truck_id: string;
					name: string;
					slug: string;
					logo_url: string | null;
					cuisine: string | null;
					lat: number;
					lng: number;
					address: string | null;
					distance_m: number;
					last_seen: string;
				}[];
			};
			get_following_feed: {
				Args: { p_limit?: number; p_before?: string };
				Returns: {
					item_type: 'special' | 'checkin';
					item_id: string;
					truck_id: string;
					truck_name: string;
					truck_slug: string;
					truck_logo: string | null;
					actor_name: string | null;
					actor_avatar: string | null;
					title: string | null;
					body: string | null;
					photo_url: string | null;
					price: number | null;
					created_at: string;
				}[];
			};
			get_truck_patrons: {
				Args: { p_truck_id: string };
				Returns: {
					foodie_id: string;
					name: string;
					avatar_url: string | null;
					checkins: number;
					first_checkin: string;
					last_checkin: string;
					follows: boolean;
				}[];
			};
		};
		Enums: { user_role: UserRole };
	};
}

export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];
export type Fn<T extends keyof Database['public']['Functions']> =
	Database['public']['Functions'][T]['Returns'];
export type { Timestamps };
