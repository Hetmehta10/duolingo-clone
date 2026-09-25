"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  abandonSession,
  ApiError,
  completeSession,
  refillHearts,
  startSession,
} from "@/lib/api";
import { checkAnswer } from "@/lib/grade";
import {
  CompleteSessionResponse,
  SessionExercise,
  StartSessionResponse,
  SubmitAnswerItem,
} from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { HeartCounter } from "@/components/ui/HeartCounter";
import { DuoButton } from "@/components/ui/DuoButton";
import { CheckIcon, CloseXIcon } from "@/components/ui/Icons";
import { MultipleChoice } from "@/components/exercises/MultipleChoice";
import { WordBank } from "@/components/exercises/WordBank";
import { MatchPairs } from "@/components/exercises/MatchPairs";
import { FillBlank } from "@/components/exercises/FillBlank";
import { TypeAnswer } from "@/components/exercises/TypeAnswer";
import { QuitConfirm } from "@/components/modals/QuitConfirm";
import { OutOfHearts } from "@/components/modals/OutOfHearts";
import { LessonComplete } from "@/components/modals/LessonComplete";

const PRAISE_WORDS = ["Nice!", "Correct!", "Amazing!", "Great job!", "Spot on!"];

type LessonStatus = "loading" | "answering" | "correct" | "wrong" | "completing";

export default function LessonPage({ params }: { params: Promise<{ skillId: string }> }) {
  const resolvedParams = use(params);
  const skillId = parseInt(resolvedParams.skillId, 10);
  const router = useRouter();
  const { user, userId, refreshUser } = useUser();

  const [session, setSession] = useState<StartSessionResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<SubmitAnswerItem[]>([]);
  const [heartsLeft, setHeartsLeft] = useState<number>(user?.hearts ?? 5);
  const [status, setStatus] = useState<LessonStatus>("loading");
  const [praiseText, setPraiseText] = useState<string>("Correct!");
  const [popHeart, setPopHeart] = useState<boolean>(false);
  const [shakeExercise, setShakeExercise] = useState<boolean>(false);

  // Modals
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showOutOfHeartsModal, setShowOutOfHeartsModal] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<CompleteSessionResponse | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // 1. Initialize Lesson Session on Mount
  useEffect(() => {
    if (!userId || isNaN(skillId)) return;

    let isMounted = true;

    startSession(userId, skillId)
      .then((data) => {
        if (!isMounted) return;
        setSession(data);
        setHeartsLeft(data.hearts);
        setCurrentIndex(0);
        setAnswers([]);
        setStatus("answering");
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err instanceof ApiError) {
          if (err.detail === "out_of_hearts") {
            setShowOutOfHeartsModal(true);
            return;
          }
          if (err.detail === "skill_locked") {
            router.push("/");
            return;
          }
        }
        setLoadingError(err.message || "Failed to start lesson");
      });

    return () => {
      isMounted = false;
    };
  }, [userId, skillId, router]);

  const exercises = session?.exercises || [];
  const currentExercise: SessionExercise | undefined = exercises[currentIndex];
  const totalExercises = exercises.length || 6;
  const progressRatio = currentIndex / totalExercises;

  // Handle Answer Evaluation
  const handleCheck = () => {
    if (!currentExercise || status !== "answering") return;

    const isCorrect = checkAnswer(currentExercise, currentAnswer);
    const recordedAnswer: SubmitAnswerItem = {
      exercise_id: currentExercise.id,
      user_answer: currentAnswer,
    };
    const updatedAnswers = [...answers, recordedAnswer];
    setAnswers(updatedAnswers);

    if (isCorrect) {
      const randomPraise = PRAISE_WORDS[Math.floor(Math.random() * PRAISE_WORDS.length)];
      setPraiseText(randomPraise);
      setStatus("correct");
    } else {
      const nextHearts = Math.max(0, heartsLeft - 1);
      setHeartsLeft(nextHearts);
      setPopHeart(true);
      setShakeExercise(true);
      setTimeout(() => setPopHeart(false), 500);
      setTimeout(() => setShakeExercise(false), 400);
      setStatus("wrong");
    }
  };

  const handleSkip = () => {
    if (!currentExercise || status !== "answering") return;
    setCurrentAnswer("");
    const recordedAnswer: SubmitAnswerItem = {
      exercise_id: currentExercise.id,
      user_answer: "",
    };
    const updatedAnswers = [...answers, recordedAnswer];
    setAnswers(updatedAnswers);

    const nextHearts = Math.max(0, heartsLeft - 1);
    setHeartsLeft(nextHearts);
    setPopHeart(true);
    setShakeExercise(true);
    setTimeout(() => setPopHeart(false), 500);
    setTimeout(() => setShakeExercise(false), 400);
    setStatus("wrong");
  };

  // Advance on Continue
  const handleContinue = async () => {
    if (!session) return;

    // If hearts reached 0, prompt out of hearts
    if (heartsLeft <= 0) {
      setShowOutOfHeartsModal(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < totalExercises) {
      setCurrentIndex(nextIndex);
      setCurrentAnswer("");
      setStatus("answering");
    } else {
      // Final submission to backend
      setStatus("completing");
      try {
        const result = await completeSession(session.session_id, answers);
        setCompletionResult(result);
      } catch (err) {
        console.error("Submission failed:", err);
        setLoadingError("Failed to submit lesson completion.");
      }
    }
  };

  const handleQuitConfirm = async () => {
    if (session) {
      try {
        await abandonSession(session.session_id);
      } catch (err) {
        console.error("Abandon failed:", err);
      }
    }
    await refreshUser();
    router.push("/");
  };

  const handleRefillHearts = async () => {
    if (!userId) return;
    try {
      const updatedUser = await refillHearts(userId);
      setHeartsLeft(updatedUser.hearts);
      setShowOutOfHeartsModal(false);
      await refreshUser();
    } catch (err) {
      console.error("Refill hearts failed:", err);
    }
  };

  const handleLessonModalClose = async () => {
    await refreshUser();
    router.push("/");
  };

  if (loadingError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-snow text-center">
        <h2 className="text-2xl font-extrabold text-cardinal mb-4">{loadingError}</h2>
        <DuoButton variant="primary" size="md" onClick={() => router.push("/")}>
          BACK TO HOME
        </DuoButton>
      </div>
    );
  }

  if (status === "loading" || !session || !currentExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-snow">
        <div className="w-12 h-12 border-4 border-feather border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-snow select-none">
      {/* 1. FIXED TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-snow/90 backdrop-blur-xs z-30 px-6 max-w-[600px] mx-auto flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setShowQuitModal(true)}
          className="text-hare hover:text-eel transition-colors p-1"
          aria-label="Quit Lesson"
        >
          <CloseXIcon className="w-6 h-6" />
        </button>

        <div className="flex-1 px-2">
          <ProgressBar progress={progressRatio} />
        </div>

        <HeartCounter count={heartsLeft} animatePop={popHeart} />
      </header>

      {/* 2. EXERCISE BODY */}
      <main className="flex-1 w-full max-w-[600px] mx-auto px-6 pt-28 pb-40 flex flex-col justify-center">
        <div className={shakeExercise ? "animate-shake" : ""}>
          {currentExercise.exercise_type === "multiple_choice" && (
            <MultipleChoice
              exercise={currentExercise}
              value={currentAnswer}
              onChange={setCurrentAnswer}
              disabled={status !== "answering"}
            />
          )}

          {currentExercise.exercise_type === "translate_word_bank" && (
            <WordBank
              exercise={currentExercise}
              value={currentAnswer}
              onChange={setCurrentAnswer}
              disabled={status !== "answering"}
            />
          )}

          {currentExercise.exercise_type === "match_pairs" && (
            <MatchPairs
              exercise={currentExercise}
              value={currentAnswer}
              onChange={setCurrentAnswer}
              disabled={status !== "answering"}
            />
          )}

          {currentExercise.exercise_type === "fill_blank" && (
            <FillBlank
              exercise={currentExercise}
              value={currentAnswer}
              onChange={setCurrentAnswer}
              disabled={status !== "answering"}
            />
          )}

          {currentExercise.exercise_type === "type_answer" && (
            <TypeAnswer
              exercise={currentExercise}
              value={currentAnswer}
              onChange={setCurrentAnswer}
              disabled={status !== "answering"}
              onEnter={handleCheck}
            />
          )}
        </div>
      </main>

      {/* 3. DYNAMIC FOOTER / FEEDBACK BAR */}
      {status === "answering" && (
        <footer className="fixed bottom-0 left-0 right-0 bg-snow border-t-2 border-swan py-5 px-6 z-30">
          <div className="max-w-[600px] mx-auto flex items-center justify-between">
            <DuoButton variant="ghost" size="md" onClick={handleSkip}>
              SKIP
            </DuoButton>

            <DuoButton
              variant={currentAnswer.trim() ? "primary" : "disabled"}
              size="md"
              disabled={!currentAnswer.trim()}
              onClick={handleCheck}
            >
              CHECK
            </DuoButton>
          </div>
        </footer>
      )}

      {status === "correct" && (
        <footer className="fixed bottom-0 left-0 right-0 bg-seaSponge min-h-[130px] py-6 px-6 z-30 animate-slide-up">
          <div className="max-w-[600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-snow flex items-center justify-center shadow-xs">
                <CheckIcon className="w-8 h-8 text-treefrog" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-treefrog">{praiseText}</span>
              </div>
            </div>

            <DuoButton variant="primary" size="lg" onClick={handleContinue}>
              CONTINUE
            </DuoButton>
          </div>
        </footer>
      )}

      {status === "wrong" && (
        <footer className="fixed bottom-0 left-0 right-0 bg-walkingFish min-h-[130px] py-6 px-6 z-30 animate-slide-up">
          <div className="max-w-[600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-snow flex items-center justify-center shadow-xs">
                <CloseXIcon className="w-8 h-8 text-fireAnt" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-fireAnt">Correct solution:</span>
                <span className="text-base font-bold text-fireAnt">
                  {currentExercise.correct_answer.value}
                </span>
              </div>
            </div>

            <DuoButton variant="danger" size="lg" onClick={handleContinue}>
              CONTINUE
            </DuoButton>
          </div>
        </footer>
      )}

      {/* 4. MODALS */}
      <QuitConfirm
        isOpen={showQuitModal}
        onQuit={handleQuitConfirm}
        onStay={() => setShowQuitModal(false)}
      />

      <OutOfHearts
        isOpen={showOutOfHeartsModal}
        userGems={user?.gems ?? 0}
        secondsUntilNext={user?.seconds_until_next_heart ?? 240 * 60}
        onRefill={handleRefillHearts}
        onAbandon={handleQuitConfirm}
      />

      {completionResult && (
        <LessonComplete result={completionResult} onContinue={handleLessonModalClose} />
      )}
    </div>
  );
}
