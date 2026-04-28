"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  ApiError,
  AuthResult,
  AuthUser,
  facebookLoginRequest,
  forgotPasswordRequest,
  googleLoginRequest,
  loginRequest,
  mapTokenToAuthUser,
  mapUserDtoToAuthUser,
  registerRequest,
  resetPasswordRequest,
  verifyEmailRequest,
} from "@/app/lib/api";

const STORAGE_KEY = "nadeef_user";

export type User = AuthUser;

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthReady: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: SignupData) => Promise<AuthResult>;
  verifyEmail: (email: string, otpCode: string) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (
    email: string,
    otpCode: string,
    newPassword: string,
  ) => Promise<AuthResult>;
  logout: () => void;
  socialLogin: (provider: string, credential?: string) => Promise<AuthResult>;
  updateUser: (patch: Partial<User>) => void;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: "Customer" | "LaundryAdmin" | "Courier";
  address?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function toAuthError(error: unknown): AuthResult {
  if (error instanceof ApiError) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: "Something went wrong. Please try again." };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
    setIsAuthReady(true);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await loginRequest(email, password);
      const nextUser = mapUserDtoToAuthUser(response);

      setUser(nextUser);
      persistUser(nextUser);

      // Check if user needs identity verification (LaundryAdmin)
      if (nextUser.needsVerification) {
        return { 
          ok: true, 
          user: nextUser, 
          requiresVerification: true,
          message: "Please complete identity verification to continue."
        };
      }

      return { ok: true, user: nextUser };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const signup = async (data: SignupData): Promise<AuthResult> => {
    try {
      const isLaundryAdmin = data.role === "LaundryAdmin";
      const response = await registerRequest({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
        phoneNumber: data.phone,
        role: data.role ?? "Customer",
      });

      if (response.token) {
        const nextUser = mapUserDtoToAuthUser(response);
        setUser(nextUser);
        persistUser(nextUser);
        
        // Check if user needs identity verification (LaundryAdmin)
        if (nextUser.needsVerification || isLaundryAdmin) {
          return { 
            ok: true, 
            user: nextUser, 
            requiresVerification: true,
            message: "Please complete identity verification to continue."
          };
        }
        
        return { ok: true, user: nextUser };
      }

      return {
        ok: true,
        requiresVerification: true,
        email: response.email,
        message: "We sent a verification code to your email.",
      };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const verifyEmail = async (
    email: string,
    otpCode: string,
  ): Promise<AuthResult> => {
    try {
      const response = await verifyEmailRequest(email, otpCode);
      const nextUser = mapTokenToAuthUser(response.token, { email });

      setUser(nextUser);
      persistUser(nextUser);

      return { ok: true, user: nextUser };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const socialLogin = async (
    provider: string,
    credential?: string,
  ): Promise<AuthResult> => {
    if (provider !== "google" && provider !== "facebook") {
      return {
        ok: false,
        message: `${provider} sign-in is not supported in this frontend.`,
      };
    }

    if (!credential) {
      return {
        ok: false,
        message: "Google sign-in did not return a valid credential.",
      };
    }

    try {
      const response =
        provider === "google"
          ? await googleLoginRequest(credential)
          : await facebookLoginRequest(credential);
      const nextUser = mapUserDtoToAuthUser(response);

      setUser(nextUser);
      persistUser(nextUser);

      return { ok: true, user: nextUser };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    try {
      const response = await forgotPasswordRequest(email);
      return {
        ok: true,
        message:
          response.message ??
          response.Message ??
          "If this email exists, an OTP has been sent.",
      };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const resetPassword = async (
    email: string,
    otpCode: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      const response = await resetPasswordRequest(email, otpCode, newPassword);
      return {
        ok: true,
        message:
          response.message ?? response.Message ?? "Password reset successfully.",
      };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const logout = () => {
    setUser(null);
    persistUser(null);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, ...patch };
      persistUser(nextUser);
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user?.token,
        isAuthReady,
        login,
        signup,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        socialLogin,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
