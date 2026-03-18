import api from "@/lib/api";
import { toApiClientError } from "@/lib/error-parser";
import { BackendUserProfile, LoginCredentials, RegisterData } from "@/types";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const formData = new FormData();
      formData.append("username", credentials.email);
      formData.append("password", credentials.password);

      const response = await api.post<LoginResponse>("/auth/login", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to login. Please try again.");
    }
  },

  async register(data: RegisterData): Promise<BackendUserProfile> {
    try {
      const response = await api.post<BackendUserProfile>(
        "/auth/register",
        data,
      );
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to register. Please try again.");
    }
  },

  async getProfile(): Promise<BackendUserProfile> {
    try {
      const response = await api.get<BackendUserProfile>("/users/me");
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to load profile.");
    }
  },

  async updateProfile(
    data: Partial<BackendUserProfile> & { password?: string },
  ): Promise<BackendUserProfile> {
    try {
      const response = await api.patch<BackendUserProfile>("/users/me", data);
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to update profile.");
    }
  },

  async googleLogin(idToken: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>("/auth/social-login", {
        provider: "google",
        token_id: idToken,
      });
      return response.data;
    } catch (error) {
      throw toApiClientError(error, "Unable to complete social login.");
    }
  },
};
