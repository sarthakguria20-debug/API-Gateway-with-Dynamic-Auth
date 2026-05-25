export interface UserPayload {
  userId: string;
  tier: "free" | "pro";
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  payload: UserPayload;
}

export interface MetricData {
  upstreamLatencyMs: number;
  gatewayLatencyMs: number;
  totalLatencyMs: number;
}

export interface GatewayResponse {
  status?: string;
  message?: string;
  error?: string;
  tier?: string;
  limit?: number;
  data?: any;
  metrics?: MetricData;
}
