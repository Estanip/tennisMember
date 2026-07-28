import type {
  ApiResponse,
  AuthUser,
  BackofficeUser,
  CreateMemberRequest,
  CreateUserRequest,
  DeleteMemberRequest,
  LoginRequest,
  LoginResponse,
  Member,
  MemberImportResult,
  MemberListQuery,
  PaginatedMembers,
  PaginatedUsers,
  UpdateMemberRequest,
  UpdateUserRequest,
  UserListQuery,
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

  async exportMembers(query: MemberListQuery = {}): Promise<void> {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.condition) params.set("condition", query.condition);
    if (query.status !== undefined) params.set("status", String(query.status));
    const qs = params.toString();
    await this.downloadFile(`/members/export${qs ? `?${qs}` : ""}`, "socios.xlsx");
  }

  async downloadMemberImportTemplate(): Promise<void> {
    await this.downloadFile("/members/import-template", "plantilla-socios.xlsx");
  }

  async importMembers(file: File): Promise<MemberImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const headers = new Headers();
    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}/members/import`, {
      method: "POST",
      headers,
      body: formData,
    });

    const json = (await response.json()) as ApiResponse<MemberImportResult>;
    if (!response.ok || !json.success) {
      const message =
        !json.success && json.message
          ? json.message
          : `Request failed with status ${response.status}`;
      throw new Error(message);
    }
    return json.data as MemberImportResult;
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

  async deleteMember(id: string, payload: DeleteMemberRequest): Promise<void> {
    await this.request<undefined>(`/members/${id}`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  }

  async restoreMember(id: string): Promise<Member> {
    return this.request<Member>(`/members/${id}/restore`, {
      method: "POST",
    });
  }

  async listUsers(query: UserListQuery = {}): Promise<PaginatedUsers> {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    if (query.search) params.set("search", query.search);
    const qs = params.toString();
    return this.request<PaginatedUsers>(`/users${qs ? `?${qs}` : ""}`);
  }

  async getUser(id: string): Promise<BackofficeUser> {
    return this.request<BackofficeUser>(`/users/${id}`);
  }

  async createUser(payload: CreateUserRequest): Promise<BackofficeUser> {
    return this.request<BackofficeUser>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateUser(id: string, payload: UpdateUserRequest): Promise<BackofficeUser> {
    return this.request<BackofficeUser>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  private async downloadFile(path: string, fallbackFilename: string): Promise<void> {
    const headers = new Headers();
    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const json = (await response.json()) as ApiResponse<unknown>;
        if (!json.success && json.message) {
          message = json.message;
        }
      } catch {
        // ignore non-JSON error bodies
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    const matched = disposition?.match(/filename="?([^"]+)"?/i);
    const filename = matched?.[1] ?? fallbackFilename;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
