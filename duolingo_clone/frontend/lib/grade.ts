import { SessionExercise } from "./types";

export function normalize(text: string | null | undefined): string {
  if (!text) return "";

  const lower = text.trim().toLowerCase();
  // Decompose accented characters and strip combining marks
  const withoutAccents = lower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Remove punctuation: ¿ ¡ ? ! . , ; : " ' ( ) - —
  const withoutPunctuation = withoutAccents.replace(/[¿¡?!.,;:"'()\-—]/g, "");

  // Collapse internal whitespace
  return withoutPunctuation.replace(/\s+/g, " ").trim();
}

export function checkAnswer(exercise: SessionExercise, userAnswer: string): boolean {
  const normUser = normalize(userAnswer);
  const correctValue = exercise.correct_answer.value;

  switch (exercise.exercise_type) {
    case "multiple_choice":
    case "fill_blank":
    case "translate_word_bank":
    case "match_pairs":
      return normUser === normalize(correctValue);

    case "type_answer": {
      if (normUser === normalize(correctValue)) {
        return true;
      }
      const accepted = exercise.correct_answer.accepted || [];
      for (const alt of accepted) {
        if (normUser === normalize(alt)) {
          return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}
