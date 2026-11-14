import { describe, it, expect } from 'vitest';
import { QUIZ_DATA, prepareQuiz } from '../src/app/models/quiz-data';
describe('quiz randomization and question integrity',()=>{
  for(const quiz of QUIZ_DATA){
    it(`${quiz.name}: fifteen unique questions retain correct answers after shuffling`,()=>{
      expect(quiz.allQuestions).toHaveLength(50);
      expect(new Set(quiz.allQuestions.map(q=>q.question.toLowerCase())).size).toBe(50);
      const original=JSON.stringify(quiz.allQuestions);
      const prepared=prepareQuiz(quiz.allQuestions,()=>0.35);
      expect(prepared).toHaveLength(15);
      expect(new Set(prepared.map(q=>q.question)).size).toBe(15);
      for(const q of prepared){const source=quiz.allQuestions.find(v=>v.question===q.question)!;expect(q.options[q.correctAnswer]).toBe(source.options[source.correctAnswer]);}
      expect(JSON.stringify(quiz.allQuestions)).toBe(original);
      for(const q of quiz.allQuestions){expect(q.correctAnswer).toBeGreaterThanOrEqual(0);expect(q.correctAnswer).toBeLessThan(q.options.length);expect(new Set(q.options).size).toBe(q.options.length);}
    });
  }
});
