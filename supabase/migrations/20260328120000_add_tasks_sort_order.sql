-- Drag-and-drop order for tasks (0-based index; lower values appear first in the app).

alter table public.tasks
  add column if not exists sort_order integer;

comment on column public.tasks.sort_order is 'Display order for manual sorting; synced from the task list UI.';

-- Backfill existing rows: match prior "newest first" ordering (created_at desc).
update public.tasks t
set sort_order = sub.idx
from (
  select
    id,
    row_number() over (
      order by created_at desc nulls last, id asc
    ) - 1 as idx
  from public.tasks
  where sort_order is null
) sub
where t.id = sub.id;
