const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type ProgramItem = { time: string; title: string; speaker?: string | null };
export type EventLink = { label: string; url: string };

export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  latitude: number;
  longitude: number;
  organizer_ids: string[];
  organizer_names: string[];
  event_type: string;
  image_url: string;
  ticket_url?: string | null;
  book_url?: string | null;
  author?: string | null;
  language: string;
  publisher?: string | null;
  for_children: boolean;
  program: ProgramItem[];
  links: EventLink[];
};

export type Organizer = {
  id: string;
  name: string;
  description: string;
  website: string;
  logo: string;
};

export type EventTypeOption = { id: string; label: string };

export type SavedFilter = {
  id: string;
  name: string;
  event_types: string[];
  organizer_ids: string[];
  languages: string[];
  publishers: string[];
  for_children?: boolean | null;
  date_from?: string | null;
  date_to?: string | null;
  radius_km?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
};

export type User = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  picture?: string | null;
  gdpr_marketing: boolean;
  gdpr_post_event_summary: boolean;
  preferences: Record<string, any>;
  saved_filters: SavedFilter[];
  favorites: string[];
  attending: string[];
  created_at: string;
};

export type Rating = {
  id: string;
  user_id: string;
  event_id: string;
  rating: number;
  would_go_again: boolean;
  comment?: string | null;
  created_at: string;
};

export type EventFilters = {
  q?: string;
  event_type?: string;
  organizer_id?: string;
  language?: string;
  publisher?: string;
  for_children?: boolean;
  date_from?: string;
  date_to?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
};

function qs(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  return (
    "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")
  );
}

async function handle(res: Response) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j && (j.detail || j.message)) msg = j.detail || j.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

function authHeaders(token?: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// Events / Organizers / Calendar / Lookups
export async function listEvents(params: EventFilters = {}): Promise<Event[]> {
  const res = await fetch(`${BASE}/api/events${qs(params)}`);
  return handle(res);
}
export async function getEvent(id: string): Promise<Event> {
  return handle(await fetch(`${BASE}/api/events/${id}`));
}
export async function listOrganizers(): Promise<Organizer[]> {
  return handle(await fetch(`${BASE}/api/organizers`));
}
export async function getOrganizer(id: string): Promise<Organizer> {
  return handle(await fetch(`${BASE}/api/organizers/${id}`));
}
export async function getOrganizerEvents(id: string): Promise<Event[]> {
  return handle(await fetch(`${BASE}/api/organizers/${id}/events`));
}
export async function getEventTypes(): Promise<EventTypeOption[]> {
  return handle(await fetch(`${BASE}/api/event-types`));
}
export async function getLanguages(): Promise<EventTypeOption[]> {
  return handle(await fetch(`${BASE}/api/languages`));
}
export async function getPublishers(): Promise<string[]> {
  return handle(await fetch(`${BASE}/api/publishers`));
}
export async function getCalendar(
  year: number,
  month: number
): Promise<{ counts: Record<string, number>; events: Event[] }> {
  return handle(await fetch(`${BASE}/api/calendar?year=${year}&month=${month}`));
}

// Auth
export async function authRegister(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gdpr_marketing: boolean;
  gdpr_post_event_summary: boolean;
}): Promise<{ user: User; session_token: string }> {
  return handle(
    await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
  );
}
export async function authLogin(data: {
  email: string;
  password: string;
}): Promise<{ user: User; session_token: string }> {
  return handle(
    await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
  );
}
export async function authGoogle(
  emergent_session_token: string
): Promise<{ user: User; session_token: string }> {
  return handle(
    await fetch(`${BASE}/api/auth/google`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ session_token: emergent_session_token }),
    })
  );
}
export async function authMe(token: string): Promise<User> {
  return handle(await fetch(`${BASE}/api/auth/me`, { headers: authHeaders(token) }));
}
export async function authUpdateMe(
  token: string,
  data: Partial<{
    first_name: string;
    last_name: string;
    gdpr_marketing: boolean;
    gdpr_post_event_summary: boolean;
    preferences: Record<string, any>;
  }>
): Promise<User> {
  return handle(
    await fetch(`${BASE}/api/auth/me`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    })
  );
}
export async function authLogout(token: string): Promise<void> {
  await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: authHeaders(token) });
}

// Saved filters
export async function addSavedFilter(token: string, data: Omit<SavedFilter, "id" | "created_at">): Promise<SavedFilter> {
  return handle(
    await fetch(`${BASE}/api/me/saved-filters`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    })
  );
}
export async function deleteSavedFilter(token: string, id: string): Promise<void> {
  await handle(
    await fetch(`${BASE}/api/me/saved-filters/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  );
}

// Favorites / Attending
export async function addFavorite(token: string, eventId: string): Promise<void> {
  await handle(await fetch(`${BASE}/api/me/favorites/${eventId}`, { method: "POST", headers: authHeaders(token) }));
}
export async function removeFavorite(token: string, eventId: string): Promise<void> {
  await handle(await fetch(`${BASE}/api/me/favorites/${eventId}`, { method: "DELETE", headers: authHeaders(token) }));
}
export async function addAttending(token: string, eventId: string): Promise<void> {
  await handle(await fetch(`${BASE}/api/me/attending/${eventId}`, { method: "POST", headers: authHeaders(token) }));
}
export async function removeAttending(token: string, eventId: string): Promise<void> {
  await handle(await fetch(`${BASE}/api/me/attending/${eventId}`, { method: "DELETE", headers: authHeaders(token) }));
}

// Ratings
export async function submitRating(
  token: string,
  eventId: string,
  data: { rating: number; would_go_again: boolean; comment?: string }
): Promise<Rating> {
  return handle(
    await fetch(`${BASE}/api/events/${eventId}/ratings`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    })
  );
}
export async function listEventRatings(eventId: string): Promise<Rating[]> {
  return handle(await fetch(`${BASE}/api/events/${eventId}/ratings`));
}
export async function listMyRatings(token: string): Promise<Rating[]> {
  return handle(await fetch(`${BASE}/api/me/ratings`, { headers: authHeaders(token) }));
}

// Admin
export type EventInput = {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  latitude: number;
  longitude: number;
  organizer_ids: string[];
  event_type: string;
  image_url: string;
  ticket_url?: string | null;
  book_url?: string | null;
  author?: string | null;
  language: string;
  publisher?: string | null;
  for_children: boolean;
  program: ProgramItem[];
  links: EventLink[];
};

export type OrganizerInput = {
  name: string;
  description: string;
  website: string;
  logo: string;
};

export async function adminLogin(pin: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  return res.ok;
}

function adminH(pin: string): HeadersInit {
  return { "Content-Type": "application/json", "X-Admin-Pin": pin };
}

export async function adminCreateEvent(pin: string, data: EventInput): Promise<Event> {
  return handle(await fetch(`${BASE}/api/admin/events`, { method: "POST", headers: adminH(pin), body: JSON.stringify(data) }));
}
export async function adminUpdateEvent(pin: string, id: string, data: EventInput): Promise<Event> {
  return handle(await fetch(`${BASE}/api/admin/events/${id}`, { method: "PUT", headers: adminH(pin), body: JSON.stringify(data) }));
}
export async function adminDeleteEvent(pin: string, id: string): Promise<void> {
  await handle(await fetch(`${BASE}/api/admin/events/${id}`, { method: "DELETE", headers: adminH(pin) }));
}
export async function adminCreateOrganizer(pin: string, data: OrganizerInput): Promise<Organizer> {
  return handle(await fetch(`${BASE}/api/admin/organizers`, { method: "POST", headers: adminH(pin), body: JSON.stringify(data) }));
}
export async function adminUpdateOrganizer(pin: string, id: string, data: OrganizerInput): Promise<Organizer> {
  return handle(await fetch(`${BASE}/api/admin/organizers/${id}`, { method: "PUT", headers: adminH(pin), body: JSON.stringify(data) }));
}
export async function adminDeleteOrganizer(pin: string, id: string): Promise<void> {
  await handle(await fetch(`${BASE}/api/admin/organizers/${id}`, { method: "DELETE", headers: adminH(pin) }));
}
