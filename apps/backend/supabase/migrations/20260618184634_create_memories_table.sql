create table memories (
  id bigint generated always as identity primary key,

  content text not null,

  metadata jsonb default '{}',

  embedding vector(768),

  user_id uuid not null,

  created_at timestamptz default now()
);