/*
 * 课程总装：把各阶段拼成完整学习路径
 */
(function (global) {
  'use strict';

  var stages = (global.STAGES_A || []).concat(global.STAGES_B || []);

  // 统计信息
  var lessonCount = 0, exerciseCount = 0, quizCount = 0;
  stages.forEach(function (s) {
    s.lessons.forEach(function (l) {
      lessonCount++;
      exerciseCount += (l.exercises || []).length;
    });
    quizCount += (s.quiz || []).length;
  });

  global.CURRICULUM = {
    title: 'Elixir 炼金术学院',
    stages: stages,
    stats: { stages: stages.length, lessons: lessonCount, exercises: exerciseCount, quiz: quizCount }
  };

})(typeof window !== 'undefined' ? window : globalThis);
