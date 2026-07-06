drop function if exists search_documents_fts(text, integer);

create function
search_documents_fts(
  query_text text,
  match_count int default 10
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  rank real
)
language sql
as $$
select
  id,
  content,
  metadata,
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