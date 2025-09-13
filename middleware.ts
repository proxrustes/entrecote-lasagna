import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (path === "/") return true;
      if (!token) return false;

      if (path.startsWith("/devices") && token.role !== "landlord") {
        return false;
      }
      if (path.startsWith("/providers") && token.role !== "landlord")
        return false;
      return true;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/devices/:path*",
    "/settings/:path*",
  ],
};
