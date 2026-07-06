create table if not exists parent_documents (
  id bigint generated always as identity primary key,

  document_id text not null,

  parent_index integer not null,

  content text not null,

  metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now()
);

create index idx_parent_document
on parent_documents(document_id);