"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  // fallback to host if origin is missing
  const origin = headersList.get("origin") ?? `${protocol}://${host}`;

  console.log("ORIGIN = ", origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error);
    return redirect("/error");
  }

  if (data.url) {
    redirect(data.url);
  }
}

// https://accounts.google.com/v3/signin/accountchooser?client_id=204344995413-lgvlu3a5ujuova62emh67brgsm8if9ld.apps.googleusercontent.com&redirect_to=http%3A%2F%2F139.59.209.55%3A3000%2Fauth%2Fcallback&redirect_uri=https%3A%2F%2Fvvvrwvxnitpmmjrmxefn.supabase.co%2Fauth%2Fv1%2Fcallback&response_type=code&scope=email+profile&state=..W99uUxeMCtN_7lbr0LDa94qcvqM7g93R4Nps7sKsf2QUx7d92DrhNrtWazUcz7wAmZbBXF3PAXL6luC-hbBx8A&dsh=S-1389955358%3A1769083589366368&o2v=2&service=lso&flowName=GeneralOAuthFlow&opparams=%253Fredirect_to%253Dhttp%25253A%25252F%25252F139.59.209.55%25253A3000%25252Fauth%25252Fcallback&continue=https%3A%2F%2Faccounts.google.com%2Fsignin%2Foauth%2Fconsent%3Fauthuser%3Dunknown%26part%3DAJi8hAOzZCcl1-nPQc_wc2Hvk58S18h5fBqJ7bTzHdJB0eRzRluuwMQWsYYhpl26FDRJM0qrCsHdRTWQHLPa8DUoJbpOC0MwFNDW-khRnWJPLQpc_a_dYzGd36AFuCfTbN-c98P-m1dNFLFeilgYZez4-QHJ3aWv-fp7IIataYzB-Ph-EybWTw2SrMcZM7YheM4voV0yoF3omwnuvUeJcgMIdViNPo-kyRV5FQNkuwg8bHeXUtDbSVXhpgYcfOgyDWjOvzxfbDACVj9JWXoxGqjSUACIvlQZu_19t1UlkHNupF3_MU2Ygbc4HKvqsayqER-mpB3C-fgz9JXGHzYbcxbApbCnJBUqXN8h-UCgUXgpYCFluxyf55WMJ_qGfQd7fEh2pzB_YyOc38Rv_mm0notfF8NZUYR6h9gjIsYbuk4UYE5FUr8c27Y_2h18O78jug_W-2VCrLPFBKGh-WYDI1DkL2B6czrKxGRD4shzlXTuWSZSfwyKoBA%26flowName%3DGeneralOAuthFlow%26as%3DS-1389955358%253A1769083589366368%26client_id%3D204344995413-lgvlu3a5ujuova62emh67brgsm8if9ld.apps.googleusercontent.com%26requestPath%3D%252Fsignin%252Foauth%252Fconsent%23&app_domain=https%3A%2F%2Fvvvrwvxnitpmmjrmxefn.supabase.co
