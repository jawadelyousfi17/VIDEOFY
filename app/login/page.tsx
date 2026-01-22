"use client";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "../../actions/login/actions";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { Spinner } from "@/components/ui/spinner";
import { Home } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    await signInWithGoogle();
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted">
        <div className="text-xl font-semibold font-serif">
          Login using your Google account
        </div>

        <form>
          <Button
            size={"lg"}
            className="border  bg-background text-foreground hover:text-primary hover:bg-background  hover:border-primary cursor-pointer w-full transition-all"
            type="submit"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? <Spinner /> : <FaGoogle />} Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
