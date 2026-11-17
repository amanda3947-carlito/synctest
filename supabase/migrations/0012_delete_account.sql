-- Sync, migration 0012: delete your own account from inside the app (Apple requires it for any app with
-- sign-up). Your builds go with you (and with them their turns, matches and chats), then the account itself,
-- which takes the profile, photos, places, shelf, blocks and reports along by cascade. Photo files in storage
-- are left behind as orphans; nothing points at them any more.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := public.me();
begin
  delete from public.builds where starter_id = u or owner_id = u;
  delete from public.build_turns where actor_id = u;
  delete from public.messages where sender_id = u;
  delete from auth.users where id = u;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
