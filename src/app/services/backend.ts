import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
export const db = createClient(environment.url, environment.publishableKey, {auth:{detectSessionInUrl:false,flowType:'pkce'}});
export const topics = ['earthquake','tsunami','typhoon','flood','landslide','volcanic eruption'];
export async function session() {
  const {data,error}=await db.auth.getSession(); if(error) throw error; return data.session;
}
export async function account() {
  const user=(await session())?.user;
  if(!user) throw new Error('Please sign in again.');
  return user;
}
export async function progressData(withAttempts=false) {
  const user=await account();
  const [profile,lessons,quizzes,history]=await Promise.all([
    db.from('profiles').select('username,address').eq('id',user.id).single(),
    db.from('lesson_completions').select('lesson_id').eq('user_id',user.id),
    db.from('quiz_results').select('topic,percentage,last_taken').eq('user_id',user.id),
    withAttempts ? db.from('quiz_attempts').select('topic,correct,total,taken_at').eq('user_id',user.id).order('taken_at',{ascending:false}).limit(10) : Promise.resolve({data:[],error:null})
  ]);
  for(const response of [profile,lessons,quizzes,history]) if(response.error) throw response.error;
  return {user,attempts:history.data??[],username:String(profile.data!.username),lessons:(lessons.data||[]).map(r=>Number(r.lesson_id)),scores:topics.map(topic=>quizzes.data?.find(r=>r.topic===topic)?.percentage ?? -1)};
}
/**
 * The day the course was first fully passed: the latest of each topic's first passing
 * attempt. Scores from before attempts were recorded fall back to their saved date.
 * Returns null when a topic has no passing record.
 */
export async function certificateIssuedOn(userId: string): Promise<string | null> {
  const [attempts, results] = await Promise.all([
    db.from('quiz_attempts').select('topic,correct,total,taken_at').eq('user_id', userId).order('taken_at', { ascending: true }).limit(2000),
    db.from('quiz_results').select('topic,percentage,last_taken').eq('user_id', userId),
  ]);
  if (attempts.error) throw attempts.error;
  if (results.error) throw results.error;
  const firstPass = new Map<string, string>();
  for (const a of attempts.data ?? []) if (!firstPass.has(a.topic) && a.total > 0 && a.correct / a.total >= 0.6) firstPass.set(a.topic, a.taken_at);
  const dates = topics.map(topic => firstPass.get(topic) ?? results.data?.find(r => r.topic === topic && r.percentage >= 60)?.last_taken);
  return dates.every(Boolean) ? (dates as string[]).sort().at(-1)! : null;
}
