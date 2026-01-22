import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.user_metadata.full_name,
            image: user.user_metadata.avatar_url,
          },
          create: {
            email: user.email,
            name: user.user_metadata.full_name,
            image: user.user_metadata.avatar_url,
          },
        });
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      // const isLocalEnv = process.env.NODE_ENV === "development";
      if (false) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.log(`Origin - ${origin}${next}`);
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
