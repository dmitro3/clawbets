"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "@/lib/api";

export interface ActivityItem {
  id: string;
  type: "bet" | "market_created";
  timestamp: number;
  agent: string;
  details: {
    marketId?: number;
    marketPublicKey?: string;
    marketTitle?: string;
    amount?: number;
    amountSol?: number;
    position?: string;
  };
}

interface ActivityData {
  activities: ActivityItem[];
  count: number;
}

export function useActivityFeed(interval = 30000) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [newItems, setNewItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/activity`);
      if (!res.ok) return;
      const data: ActivityData = await res.json();
      const items = data.activities;

      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        for (const item of items) {
          seenIdsRef.current.add(item.id);
        }
        setActivities(items);
        setLoading(false);
        return;
      }

      const fresh: ActivityItem[] = [];
      for (const item of items) {
        if (!seenIdsRef.current.has(item.id)) {
          seenIdsRef.current.add(item.id);
          fresh.push(item);
        }
      }

      if (fresh.length > 0) {
        setNewItems(fresh);
      }
      setActivities(items);
      setLoading(false);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const id = setInterval(fetchActivity, interval);
    return () => clearInterval(id);
  }, [fetchActivity, interval]);

  const clearNewItems = useCallback(() => setNewItems([]), []);

  return { activities, newItems, clearNewItems, loading };
}
