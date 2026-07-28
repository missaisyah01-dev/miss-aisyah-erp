-- KasirIntelek foundation. This migration is additive and does not alter ERP tables.
do $$ begin
  create type public.ai_message_role as enum ('user', 'assistant', 'system', 'tool');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ai_memory_type as enum ('preference', 'summary', 'favorite_command', 'recent_activity');
exception when duplicate_object then null;
end $$;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  tool_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type public.ai_memory_type not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_conversations_user_updated_idx on public.ai_conversations (user_id, updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);
create index if not exists ai_memory_user_created_idx on public.ai_memory (user_id, created_at desc);
create index if not exists ai_audit_log_user_created_idx on public.ai_audit_log (user_id, created_at desc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_memory enable row level security;
alter table public.ai_audit_log enable row level security;

create policy "Users manage own AI conversations" on public.ai_conversations
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage messages in own AI conversations" on public.ai_messages
for all to authenticated using (
  exists (select 1 from public.ai_conversations where id = conversation_id and user_id = auth.uid())
) with check (
  exists (select 1 from public.ai_conversations where id = conversation_id and user_id = auth.uid())
);

create policy "Users manage own AI memory" on public.ai_memory
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users insert own AI audit logs" on public.ai_audit_log
for insert to authenticated with check (user_id = auth.uid());
create policy "Users read own AI audit logs" on public.ai_audit_log
for select to authenticated using (user_id = auth.uid());
create policy "Owner manager read AI audit logs" on public.ai_audit_log
for select to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN'));
