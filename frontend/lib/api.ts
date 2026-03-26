import axios from "axios";
import { clearAllClientCache, getAccessToken } from "@/lib/auth-storage";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

const inFlightRequests = new Map<string, Promise<any>>();
const dedupePostPaths = new Set(["/rag/query"]);

function buildRequestKey(
  method: string,
  url: string,
  params?: unknown,
  data?: unknown,
): string {
  return [
    method,
    url,
    JSON.stringify(params ?? null),
    JSON.stringify(data ?? null),
  ].join("|");
}

function shouldDedupe(method: string, url: string): boolean {
  if (method === "get") {
    return true;
  }
  if (method === "post" && dedupePostPaths.has(url)) {
    return true;
  }
  return false;
}

const originalGet = api.get.bind(api);
const originalPost = api.post.bind(api);

(api as any).get = function dedupedGet(url: string, config?: any) {
  const method = "get";
  if (!shouldDedupe(method, url)) {
    return originalGet(url, config);
  }

  const key = buildRequestKey(method, url, config?.params, undefined);
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing;
  }

  const request = originalGet(url, config).finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, request);
  return request;
};

(api as any).post = function dedupedPost(
  url: string,
  data?: any,
  config?: any,
) {
  const method = "post";
  if (!shouldDedupe(method, url)) {
    return originalPost(url, data, config);
  }

  const key = buildRequestKey(method, url, config?.params, data);
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing;
  }

  const request = originalPost(url, data, config).finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, request);
  return request;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAllClientCache();
      if (typeof window !== "undefined") {
        // window.location.href = '/auth'; // Optional: redirect on 401
      }
    }
    return Promise.reject(error);
  },
);

export default api;
