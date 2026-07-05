
-- Sparse Retrieval Initial
-- PostgreSQL Full Text Search (FTS)


alter table documents
add column if not exists fts tsvector
generated always as (
  to_tsvector(
    'english',
    coalesce(content, '')
  )
) stored;

create index if not exists documents_fts_idx
on documents
using gin (fts);


-- Full Text Search RPC


create or replace function
search_documents_fts(
  query_text text,
  match_count int default 10
)
returns table (
  id bigint,
  content text,
  rank real
)
language sql
as $$
select
  id,
  content,
  ts_rank(
    fts,
    plainto_tsquery(
      'english',
      query_text
    )
  ) as rank
from documents
where
  fts @@ plainto_tsquery(
    'english',
    query_text
  )
order by rank desc
limit match_count;
$$;