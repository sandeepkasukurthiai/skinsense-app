import type { Session } from "@supabase/supabase-js";
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";

import type { Patient } from "@skinsense/shared";

import { api } from "./api";
import { supabase } from "./supabase";

type SessionState = {
  loading: boolean;
  session: Session | null;
  /** The patient record linked to this login (null until linked or created). */
  patient: Patient | null;
  refreshPatient: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  const loadPatient = useCallback(async (s: Session | null) => {
    if (!s) {
      setPatient(null);
      return;
    }
    const { data } = await supabase
      .from("patients")
      .select("*")
      .eq("auth_user_id", s.user.id)
      .maybeSingle();
    if (data) {
      setPatient(data);
      return;
    }
    // First sign-in: link an existing clinic record with this phone, if any.
    try {
      const res = await api<{ patient: Patient | null }>("/api/patient/claim", { method: "POST", body: {} });
      setPatient(res.patient);
    } catch {
      setPatient(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadPatient(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      void loadPatient(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadPatient]);

  const value: SessionState = {
    loading,
    session,
    patient,
    refreshPatient: () => loadPatient(session),
    signOut: async () => {
      await supabase.auth.signOut();
      setPatient(null);
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
