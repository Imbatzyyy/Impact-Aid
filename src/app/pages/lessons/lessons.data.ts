// src/app/pages/lessons/lessons.data.ts

export interface Lesson {
  id: number;
  title: string;
  description: string;
  duration: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 1,
    title: 'Introduction to Disaster Awareness',
    description: 'Learn what disasters are and how they affect communities.',
    duration: '10 mins'
  },
  {
    id: 2,
    title: 'Preparedness and Early Warning',
    description: 'Discover ways to prepare for natural disasters.',
    duration: '8 mins'
  },
  {
    id: 3,
    title: 'Community Resilience',
    description: 'Explore how communities can recover faster after disasters.',
    duration: '12 mins'
  },
  {
    id: 4,
    title: 'Emergency Response',
    description: 'Learn how to respond effectively during emergencies.',
    duration: '15 mins'
  },
  {
    id: 5,
    title: 'First Aid Basics',
    description: 'Understand essential first aid steps for common injuries.',
    duration: '9 mins'
  },
  {
    id: 6,
    title: 'Recovery and Rehabilitation',
    description: 'Know how to rebuild after a disaster strikes.',
    duration: '11 mins'
  }
];

