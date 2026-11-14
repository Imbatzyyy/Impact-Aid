import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
export const db = createClient(environment.url, environment.publishableKey, {auth:{detectSessionInUrl:false}});
export const topics = ['earthquake','tsunami','typhoon','flood','landslide','volcanic eruption'];
export async function session() {
  const {data,error}=await db.auth.getSession(); if(error) throw error; return data.session;
}
export async function account() {
  const user=(await session())?.user;
  if(!user) throw new Error('Please sign in again.');
  return user;
}
export async function progressData() {
  const user=await account();
  const [profile,lessons,quizzes]=await Promise.all([
    db.from('profiles').select('username,address').eq('id',user.id).single(),
    db.from('lesson_completions').select('lesson_id').eq('user_id',user.id),
    db.from('quiz_results').select('topic,percentage,last_taken').eq('user_id',user.id)
  ]);
  for(const response of [profile,lessons,quizzes]) if(response.error) throw response.error;
  return {user,username:String(profile.data!.username),lessons:(lessons.data||[]).map(r=>Number(r.lesson_id)),scores:topics.map(topic=>quizzes.data?.find(r=>r.topic===topic)?.percentage ?? -1)};
}
