import "next-auth";
import { Permission } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      _id?: string;
      id?: string;
      name?: string;
      mobileNumber?: string;
      role?: "Admin" | "Manager" | "Supervisor" | "Worker";
      permissions?: Permission[];
      isActive?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    _id?: string;
    id?: string;
    name?: string;
    mobileNumber?: string;
    role?: "Admin" | "Manager" | "Supervisor" | "Worker";
    permissions?: Permission[];
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    id?: string;
    name?: string;
    mobileNumber?: string;
    role?: "Admin" | "Manager" | "Supervisor" | "Worker";
    permissions?: Permission[];
    isActive?: boolean;
  }
}
