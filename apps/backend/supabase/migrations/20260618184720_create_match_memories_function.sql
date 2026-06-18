create or replace function
match_memories(
  query_embedding vector,
  match_count integer default null,
  filter jsonb default '{}'::jsonb
)
returns table(
  id bigint,
  content text,
  metadata jsonb,
  embedding jsonb,
  similarity double precision
)
language plpgsql
as $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    (embedding::text)::jsonb as embedding,
    1 - (
      memories.embedding <=> query_embedding
    ) as similarity
  from memories
  where metadata @> filter
  order by memories.embedding <=> query_embedding
  limit match_count;
end;
$function$;