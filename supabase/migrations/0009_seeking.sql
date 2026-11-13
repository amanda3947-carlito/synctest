-- Sync, migration 0009: what you are looking for on aux (asked after the birthday).
alter table public.profiles add column if not exists seeking text
  check (seeking is null or seeking in ('friends', 'crush', 'casual', 'serious', 'longterm'));
