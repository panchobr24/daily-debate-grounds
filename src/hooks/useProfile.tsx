import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data || null);
        setLoading(false);
      });
  }, [user]);

  return { profile, loading };
} 