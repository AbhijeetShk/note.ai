create extension if not exists vector;

create table documents (
  id bigint generated always as identity primary key,

  content text,

  metadata jsonb,

  embedding vector(768),

  user_id uuid
);