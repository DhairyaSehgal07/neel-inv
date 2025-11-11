import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      _id?: string;
      name?: string;
      mobileNumber?: string;
      role?: "Admin" | "Manager" | "Supervisor" | "Worker";
      isActive?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    _id?: string;
    name?: string;
    mobileNumber?: string;
    role?: "Admin" | "Manager" | "Supervisor" | "Worker";
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    name?: string;
    mobileNumber?: string;
    role?: "Admin" | "Manager" | "Supervisor" | "Worker";
    isActive?: boolean;
  }
}
