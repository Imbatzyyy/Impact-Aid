-- PostgREST includes the two conflict columns in an upsert's UPDATE list.
-- Both USING and WITH CHECK still limit each row to the current account.
grant update(user_id,topic) on public.quiz_results to authenticated;
