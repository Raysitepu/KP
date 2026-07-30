import "server-only";

import type { ConversationState } from "@/types/chatbot";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const memory = new Map<string, ConversationState>();

export function createConversationId() {
  return crypto.randomUUID();
}

export async function getConversationState(conversationId: string) {
  const local = memory.get(conversationId);
  if (local) return local;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("weather_conversations")
    .select("state_data")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) {
    console.error("Conversation state gagal dibaca:", error.code);
    return null;
  }
  if (!data?.state_data) return null;
  const state = data.state_data as ConversationState;
  memory.set(conversationId, state);
  return state;
}

export async function saveConversationState(state: ConversationState) {
  memory.set(state.conversationId, state);
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.from("weather_conversations").upsert(
    {
      id: state.conversationId,
      state_data: state,
      updated_at: state.updatedAt,
    },
    { onConflict: "id" },
  );
  if (error) console.error("Conversation state gagal disimpan:", error.code);
}
