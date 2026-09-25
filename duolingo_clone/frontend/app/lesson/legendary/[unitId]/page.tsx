"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  abandonSession,
  ApiError,
  completeSession,
  startLegendarySession,
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
import { DuoButton } from "@/components/ui/DuoButton";
import { CheckIcon, CloseXIcon, TrophyIcon, HeartIcon } from "@/components/ui/Icons";
import { MultipleChoice } from "@/components/exercises/MultipleChoice";
import { WordBank } from "@/components/exercises/WordBank";
import { MatchPairs } from "@/components/exercises/MatchPairs";
import { FillBlank } from "@/components/exercises/FillBlank";
import { TypeAnswer } from "@/components/exercises/TypeAnswer";
import { QuitConfirm } from "@/components/modals/QuitConfirm";
import { Mascot } from "@/components/ui/Mascot";

const PRAISE_WORDS = ["Legendary!", "Flawless!", "Superb!", "Spot on!", "Mastery!"];

type LessonStatus = "loading" | "answering" | "correct" | "wrong" | "completing";

export default function LegendaryLessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const resolvedParams = use(params);
  const unitId = parseInt(resolvedParams.unitId, 10);
  const router = useRouter();
  const { userId, refreshUser } = useUser();

  const [session, setSession] = useState<StartSessionResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<SubmitAnswerItem[]>([]);
  const [mistakesMade, setMistakesMade] = useState<number>(0);
  const [status, setStatus] = useState<LessonStatus>("loading");
  const [praiseText, setPraiseText] = useState<string>("Legendary!");
  const [shakeExercise, setShakeExercise] = useState<boolean>(false);

  // Modals
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showFailedModal, setShowFailedModal] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<CompleteSessionResponse | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const initSession = () => {
    if (!userId || isNaN(unitId)) return;
    setStatus("loading");
    setShowFailedModal(false);
    setLoadingError(null);

    startLegendarySession(userId, unitId)
      .then((data) => {
        setSession(data);
        setCurrentIndex(0);
        setAnswers([]);
        setMistakesMade(0);
        setStatus("answering");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.detail === "legendary_locked") {
          router.push("/");
          return;
        }
        setLoadingError(err.message || "Failed to start legendary challenge");
      });
  };

  useEffect(() => {
    initSession();
  }, [userId, unitId]);

  const exercises = session?.exercises || [];
  const currentExercise: SessionExercise | undefined = exercises[currentIndex];
  const totalExercises = exercises.length || 10;
  const progressRatio = currentIndex / totalExercises;

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
      const nextMistakes = mistakesMade + 1;
      setMistakesMade(nextMistakes);
      setShakeExercise(true);
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

    const nextMistakes = mistakesMade + 1;
    setMistakesMade(nextMistakes);
    setShakeExercise(true);
    setTimeout(() => setShakeExercise(false), 400);
    setStatus("wrong");
  };

  const handleContinue = async () => {
    if (!session) return;

    if (mistakesMade >= 3) {
      setShowFailedModal(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < totalExercises) {
      setCurrentIndex(nextIndex);
      setCurrentAnswer("");
      setStatus("answering");
    } else {
      setStatus("completing");
      try {
        const result = await completeSession(session.session_id, answers);
        setCompletionResult(result);
      } catch (err) {
        console.error("Submission failed:", err);
        setLoadingError("Failed to submit legendary challenge completion.");
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
        <div className="w-12 h-12 border-4 border-bee border-t-transparent rounded-full animate-spin" />
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
          aria-label="Quit Challenge"
        >
          <CloseXIcon className="w-6 h-6" />
        </button>

        <div className="flex-1 px-2">
          <ProgressBar progress={progressRatio} />
        </div>

        {/* LEGENDARY Badge & 3 Mistake Pips */}
        <div className="flex items-center gap-3">
          <div className="bg-bee text-snow text-[10px] font-black uppercase px-2 py-0.5 rounded-pill tracking-wider">
            LEGENDARY
          </div>

          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => {
              const isSpent = i < mistakesMade;
              return (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    isSpent
                      ? "bg-swan border-swan text-hare"
                      : "bg-cardinal border-cardinal text-snow"
                  }`}
                >
                  <HeartIcon className={`w-3.5 h-3.5 ${isSpent ? "text-hare" : "text-snow"}`} />
                </div>
              );
            })}
          </div>
        </div>
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

      {/* 3. FOOTER */}
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

      {/* MODALS */}
      <QuitConfirm
        isOpen={showQuitModal}
        onQuit={handleQuitConfirm}
        onStay={() => setShowQuitModal(false)}
      />

      {/* Challenge Failed Modal */}
      {showFailedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-snow rounded-card border-2 border-swan p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-pop">
            <Mascot mood="sad" size={120} />
            <h3 className="text-2xl font-extrabold text-cardinal mt-4">
              Challenge failed
            </h3>
            <p className="text-sm font-bold text-wolf mt-2 mb-6">
              You made 3 mistakes. Try again when you're ready.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <DuoButton variant="primary" size="md" fullWidth onClick={initSession}>
                RETRY
              </DuoButton>
              <DuoButton variant="ghost" size="md" fullWidth onClick={handleQuitConfirm}>
                BACK TO PATH
              </DuoButton>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completionResult && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-snow p-6 sm:p-10 animate-pop overflow-y-auto">
          <div className="flex flex-col items-center justify-center flex-1 max-w-md w-full text-center my-auto">
            <TrophyIcon className="w-28 h-28 text-bee animate-bounce-soft" size={112} />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-bee mt-6">
              Legendary!
            </h1>
            <p className="text-base font-bold text-wolf mt-2">
              Unit Mastered! You earned +40 XP!
            </p>

            <div className="bg-snow border-2 border-bee rounded-card p-6 w-full mt-8 flex flex-col items-center gap-2 shadow-xs">
              <span className="text-xs uppercase font-black text-wolf tracking-wider">
                Total Reward
              </span>
              <span className="text-4xl font-black text-bee">+40 XP</span>
            </div>
          </div>

          <div className="w-full max-w-md pt-4 border-t-2 border-swan mt-6">
            <DuoButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={async () => {
                await refreshUser();
                router.push("/");
              }}
            >
              CONTINUE
            </DuoButton>
          </div>
        </div>
      )}
    </div>
  );
}
