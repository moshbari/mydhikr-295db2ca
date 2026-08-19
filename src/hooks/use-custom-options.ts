import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Category = "dhikr" | "quran" | "salah";

const savedKey = (userId: string, category: Category) => `custom_options_${userId}_${category}`;
const removedKey = (userId: string, category: Category) => `removed_options_${userId}_${category}`;

const read = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const write = (key: string, values: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // A full or blocked localStorage shouldn't break adding an entry.
  }
};

/**
 * The worship types a member adds themselves.
 *
 * `islamic_options` is the shared list and only an admin may write to it, so a
 * member's own name can't live there. Each custom name is kept in this browser
 * the moment it's created, and recovered from the member's own past entries
 * when they sign in on another device — which is also how a name they added on
 * the phone shows up here. Removed names are remembered, or the entries already
 * logged under one would keep bringing it back.
 */
export const useCustomOptions = (category: Category, builtIn: string[]) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setSaved([]);
      setRemoved([]);
      setHistory([]);
      return;
    }

    setSaved(read(savedKey(user.id, category)));
    setRemoved(read(removedKey(user.id, category)));

    let cancelled = false;

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("daily_entries")
        .select("name")
        .eq("user_id", user.id)
        .eq("type", category)
        .order("created_at", { ascending: false })
        .limit(500);

      if (cancelled || error || !data) return;

      const seen = new Set<string>();
      const names: string[] = [];
      for (const row of data) {
        const name = (row as { name: string }).name;
        const key = name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          names.push(name);
        }
      }
      setHistory(names);
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user, category]);

  const builtInKeys = new Set(builtIn.map((name) => name.toLowerCase()));
  const removedKeys = new Set(removed.map((name) => name.toLowerCase()));

  const customOptions: string[] = [];
  const seen = new Set<string>();
  for (const name of [...saved, ...history]) {
    const key = name.toLowerCase();
    if (builtInKeys.has(key) || removedKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    customOptions.push(name);
  }

  const addCustomOption = useCallback(
    (name: string): string | null => {
      const cleaned = name.trim();
      if (!cleaned || !user) return null;

      setSaved((current) => {
        const next = current.some((n) => n.toLowerCase() === cleaned.toLowerCase())
          ? current
          : [...current, cleaned];
        write(savedKey(user.id, category), next);
        return next;
      });

      // Adding it back undoes an earlier removal.
      setRemoved((current) => {
        const next = current.filter((n) => n.toLowerCase() !== cleaned.toLowerCase());
        write(removedKey(user.id, category), next);
        return next;
      });

      return cleaned;
    },
    [user, category]
  );

  const removeCustomOption = useCallback(
    (name: string) => {
      if (!user) return;

      setSaved((current) => {
        const next = current.filter((n) => n.toLowerCase() !== name.toLowerCase());
        write(savedKey(user.id, category), next);
        return next;
      });

      setRemoved((current) => {
        const next = current.some((n) => n.toLowerCase() === name.toLowerCase())
          ? current
          : [...current, name];
        write(removedKey(user.id, category), next);
        return next;
      });
    },
    [user, category]
  );

  return { customOptions, addCustomOption, removeCustomOption };
};
