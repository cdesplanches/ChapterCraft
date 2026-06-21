export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export const SESSION_COOKIE = "chaptercraft_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
