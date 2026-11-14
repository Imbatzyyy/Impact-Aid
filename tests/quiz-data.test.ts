import { describe, it, expect } from 'vitest';
import { QUIZ_DATA, prepareQuiz } from '../src/app/models/quiz-data';
describe('quiz randomization and question integrity',()=>{
  for(const quiz of QUIZ_DATA){
    it(`${quiz.name}: ten unique questions retain correct answers after shuffling`,()=>{
      expect(quiz.allQuestions).toHaveLength(30);
      const original=JSON.stringify(quiz.allQuestions);
      const prepared=prepareQuiz(quiz.allQuestions,()=>0.35);
      expect(prepared).toHaveLength(10);
      expect(new Set(prepared.map(q=>q.question)).size).toBe(10);
      for(const q of prepared){const source=quiz.allQuestions.find(v=>v.question===q.question)!;expect(q.options[q.correctAnswer]).toBe(source.options[source.correctAnswer]);}
      expect(JSON.stringify(quiz.allQuestions)).toBe(original);
      for(const q of quiz.allQuestions){expect(q.correctAnswer).toBeGreaterThanOrEqual(0);expect(q.correctAnswer).toBeLessThan(q.options.length);expect(new Set(q.options).size).toBe(q.options.length);}
    });
  }
});
