export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
}

export type OAuthProvider = 'google' | 'discord';

export interface OAuth2UrlResponse {
  url: string;
}

export interface OAuth2CallbackRequest {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}
