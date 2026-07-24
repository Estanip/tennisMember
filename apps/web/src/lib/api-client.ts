import type {
  ApiResponse,
  AuthUser,
  CreateMemberRequest,
  LoginRequest,
  LoginResponse,
  Member,
  MemberListQuery,
  PaginatedMembers,
  UpdateMemberRequest,
} from "@socios/shared";

const TOKEN_KEY = "socios_token";

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  getToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null): void {
    if (typeof window === "undefined") {
      return;
    }
    if (!token) {
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    }
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
    this.setToken(data.token);
    return data;
  }

  async me(): Promise<AuthUser> {
    return this.request<AuthUser>("/auth/me");
  }

  async listMembers(query: MemberListQuery = {}): Promise<PaginatedMembers> {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.search) params.set("search", query.search);
    if (query.condition) params.set("condition", query.condition);
    if (query.status !== undefined) params.set("status", String(query.status));
    const qs = params.toString();
    return this.request<PaginatedMembers>(`/members${qs ? `?${qs}` : ""}`);
  }

  async getMember(id: string): Promise<Member> {
    return this.request<Member>(`/members/${id}`);
  }

  async createMember(payload: CreateMemberRequest): Promise<Member> {
    return this.request<Member>("/members", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateMember(id: string, payload: UpdateMemberRequest): Promise<Member> {
    return this.request<Member>(`/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteMember(id: string): Promise<void> {
    await this.request<undefined>(`/members/${id}`, {
      method: "DELETE",
    });
  }

  private async request<T>(
    path: string,
    options: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);

    if (options.body !== undefined && options.body !== null) {
      headers.set("Content-Type", "application/json");
    }

    if (options.auth !== false) {
      const token = this.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !json.success) {
      const message =
        !json.success && json.message
          ? json.message
          : `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return json.data as T;
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
);
