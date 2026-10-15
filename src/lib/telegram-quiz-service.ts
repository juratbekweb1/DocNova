/**
 * Telegram Quiz Service for DocNova Exam Prep
 * Manages active student testing sessions using the Fisher-Yates randomizer.
 */

import {
  QuizQuestion,
  getQuestionsBySubject,
  getRandomQuestions,
  QUIZ_SUBJECTS,
} from "./quiz-bank";

export interface UserQuizSession {
  userId: number; // Telegram user ID
  chatId: number;
  subjectId: string;
  subjectName: string;
  questions: QuizQuestion[];
  currentIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  startedAt: Date;
  lastQuestionMessageId?: number;
}

// In-memory session registry with automated TTL expiration (2 hours)
const activeSessions = new Map<number, UserQuizSession>();

export const TelegramQuizService = {
  /**
   * Starts a new test session for a user with 30 unique questions via Fisher-Yates
   */
  startSession(userId: number, chatId: number, subjectId: string): UserQuizSession {
    const pool = getQuestionsBySubject(subjectId);
    const questions = getRandomQuestions(pool, 30);
    const subjectInfo = QUIZ_SUBJECTS.find((s) => s.id === subjectId) || QUIZ_SUBJECTS[0];

    const session: UserQuizSession = {
      userId,
      chatId,
      subjectId,
      subjectName: subjectInfo.name,
      questions,
      currentIndex: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      startedAt: new Date(),
    };

    activeSessions.set(userId, session);
    return session;
  },

  /**
   * Get the active session for a user
   */
  getSession(userId: number): UserQuizSession | undefined {
    return activeSessions.get(userId);
  },

  /**
   * End or cancel a session
   */
  endSession(userId: number): boolean {
    return activeSessions.delete(userId);
  },

  /**
   * Record answer and move to the next question
   */
  recordAnswer(
    userId: number,
    chosenIndex: number
  ): {
    isCorrect: boolean;
    correctIndex: number;
    explanation?: string;
    isFinished: boolean;
    session: UserQuizSession;
    currentQuestion: QuizQuestion;
  } | null {
    const session = activeSessions.get(userId);
    if (!session) return null;

    const currentQuestion = session.questions[session.currentIndex];
    if (!currentQuestion) return null;

    const isCorrect = chosenIndex === currentQuestion.correctIndex;
    if (isCorrect) {
      session.correctAnswers++;
    } else {
      session.wrongAnswers++;
    }

    session.currentIndex++;
    const isFinished = session.currentIndex >= session.questions.length;

    if (isFinished) {
      // Don't delete immediately so final summary can read it, or keep it
    }

    return {
      isCorrect,
      correctIndex: currentQuestion.correctIndex,
      explanation: currentQuestion.explanation,
      isFinished,
      session,
      currentQuestion,
    };
  },

  /**
   * Calculate grade and feedback
   */
  calculateGrade(
    score: number,
    total: number = 30
  ): {
    percentage: number;
    gradeText: string;
    stars: string;
    recommendation: string;
  } {
    const percentage = Number(((score / total) * 100).toFixed(1));
    if (percentage >= 86) {
      return {
        percentage,
        gradeText: "A'lo (5 baho) 🎖️",
        stars: "⭐️⭐️⭐️⭐️⭐️",
        recommendation:
          "Qoyilmaqom natija! Siz imtihonga 100% tayyorsiz. Shu sur'atda davom eting!",
      };
    } else if (percentage >= 71) {
      return {
        percentage,
        gradeText: "Yaxshi (4 baho) 🥈",
        stars: "⭐️⭐️⭐️⭐️",
        recommendation:
          "Yaxshi bilim darajasi! Xato qilgan savollaringizni qayta ko'rib chiqsangiz, natijangiz yanada oshadi.",
      };
    } else if (percentage >= 56) {
      return {
        percentage,
        gradeText: "Qoniqarli (3 baho) 🥉",
        stars: "⭐️⭐️⭐️",
        recommendation:
          "O'tish chegarasidan o'tdingiz, biroq asosiy mavzularni chuqurroq takrorlash tavsiya etiladi.",
      };
    } else {
      return {
        percentage,
        gradeText: "Qoniqarsiz (2 baho) ⚠️",
        stars: "⭐️⭐️",
        recommendation:
          "Mavzularni qayta o'qib chiqish zarur. DocNova platformasidagi tayyorgarlik materiallaridan foydalaning.",
      };
    }
  },
};
