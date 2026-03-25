import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      if (!token) {
        return false;
      }

      if (path.startsWith("/admin")) {
        return token.role === "admin";
      }

      if (path.startsWith("/dashboard") || path.startsWith("/exam") || path.startsWith("/results")) {
        return token.role === "student" || token.role === "admin";
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/exam/:path*", "/results/:path*"],
};

