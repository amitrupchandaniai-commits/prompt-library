alter table public.prompt_versions drop constraint prompt_versions_change_source_check;

alter table public.prompt_versions add constraint prompt_versions_change_source_check
  check (change_source in ('original', 'user_edit', 'ai_improved', 'ai_tested', 'restored'));
