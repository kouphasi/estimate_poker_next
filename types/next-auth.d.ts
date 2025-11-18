import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isGuest: boolean;
    };
  }

  interface User {
    id: string;
    email: string | null;
    name: string;
    isGuest: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isGuest: boolean;
  }
}
