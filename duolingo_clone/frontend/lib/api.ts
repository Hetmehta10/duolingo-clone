import {
  CompleteSessionResponse,
  CourseOverview,
  DevStatusResponse,
  LeaderboardResponse,
  StartSessionResponse,
  SubmitAnswerItem,
  UserListItem,
  UserProfile,
  UserTopBar,
} from "./types";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === "string") {
        detail = errorJson.detail;
      } else if (errorJson.detail) {
        detail = JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore parse failure
    }
    throw new ApiError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

export async function getUsers(): Promise<UserListItem[]> {
  return request<UserListItem[]>("/api/users");
}

export async function getUser(userId: number): Promise<UserTopBar> {
  return request<UserTopBar>(`/api/users/${userId}`);
}

export async function getProfile(userId: number): Promise<UserProfile> {
  return request<UserProfile>(`/api/users/${userId}/profile`);
}

export async function refillHearts(userId: number): Promise<UserTopBar> {
  return request<UserTopBar>(`/api/users/${userId}/refill-hearts`, {
    method: "POST",
  });
}

export async function getCourse(userId: number): Promise<CourseOverview> {
  return request<CourseOverview>(`/api/course?user_id=${userId}`);
}

export async function startSession(userId: number, skillId: number): Promise<StartSessionResponse> {
  return request<StartSessionResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, skill_id: skillId }),
  });
}

export async function startLegendarySession(userId: number, unitId: number): Promise<StartSessionResponse> {
  return request<StartSessionResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, unit_id: unitId }),
  });
}

export async function completeSession(
  sessionId: number,
  answers: SubmitAnswerItem[]
): Promise<CompleteSessionResponse> {
  return request<CompleteSessionResponse>(`/api/sessions/${sessionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function abandonSession(sessionId: number): Promise<{ status: string; detail?: string }> {
  return request<{ status: string; detail?: string }>(`/api/sessions/${sessionId}/abandon`, {
    method: "POST",
  });
}

export async function getLeaderboard(userId?: number, limit: number = 10): Promise<LeaderboardResponse> {
  const query = new URLSearchParams();
  if (userId !== undefined) {
    query.set("user_id", userId.toString());
  }
  query.set("limit", limit.toString());
  return request<LeaderboardResponse>(`/api/leaderboard?${query.toString()}`);
}

export async function advanceDay(userId: number, days: number = 1): Promise<DevStatusResponse> {
  return request<DevStatusResponse>(`/api/dev/advance-day?user_id=${userId}&days=${days}`, {
    method: "POST",
  });
}

export async function setHearts(userId: number, hearts: number): Promise<DevStatusResponse> {
  return request<DevStatusResponse>(`/api/dev/set-hearts?user_id=${userId}&hearts=${hearts}`, {
    method: "POST",
  });
}

export async function resetUser(userId: number): Promise<DevStatusResponse> {
  return request<DevStatusResponse>(`/api/dev/reset-user?user_id=${userId}`, {
    method: "POST",
  });
}
