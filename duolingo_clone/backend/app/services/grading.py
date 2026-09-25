"""Grading service for evaluating exercise responses across all exercise types."""

from __future__ import annotations

import re
import unicodedata
from typing import Any
from app.models import Exercise, ExerciseType


def normalize(text: str) -> str:
    """Normalize input strings for fair and lenient linguistic comparison.

    Learners typing in Spanish may omit diacritical marks or punctuation marks
    like inverted question marks (¿) and exclamation points (¡). This function
    decomposes unicode characters, strips all diacritical accents, removes extraneous
    punctuation, and collapses internal whitespace, producing a canonical lowercase
    string that allows the evaluator to focus on vocabulary correctness.

    Returns the cleaned, normalized string.
    """
    if text is None:
        return ""

    # Convert to lowercase and strip leading/trailing whitespace
    text = str(text).strip().lower()

    # Decompose unicode characters to separate base glyphs from combining marks (accents, tildes, diaereses)
    nfd_chars = unicodedata.normalize("NFD", text)
    # Filter out combining diacritical marks (Mn category)
    without_accents = "".join(c for c in nfd_chars if unicodedata.category(c) != "Mn")

    # Remove punctuation: ¿ ¡ ? ! . ,
    cleaned = re.sub(r"[¿¡?!.,;:\"'()\-—]", "", without_accents)

    # Collapse multiple whitespace characters into single space
    return " ".join(cleaned.split())


def check_answer(exercise: Exercise, user_answer: str) -> bool:
    """Determine whether a learner's submitted answer is correct for the given exercise.

    Dispatches grading based on exercise type. Multiple choice, word bank, and fill-in-the-blank
    exercises are checked for normalized equality against the primary answer. Free-form
    type-in exercises are also checked against an optional list of accepted alternative
    phrasings to accommodate natural translation variations. Match pair exercises verify
    that all pairs were correctly identified.

    Returns True if the response is deemed correct, otherwise False.
    """
    if not isinstance(exercise.correct_answer, dict):
        raise ValueError(f"Exercise {exercise.id} does not have a valid correct_answer dictionary.")

    ex_type = exercise.exercise_type
    correct_value = exercise.correct_answer.get("value", "")
    norm_user = normalize(user_answer)

    if ex_type in (
        ExerciseType.MULTIPLE_CHOICE,
        ExerciseType.FILL_BLANK,
        ExerciseType.TRANSLATE_WORD_BANK,
        ExerciseType.MATCH_PAIRS,
        "multiple_choice",
        "fill_blank",
        "translate_word_bank",
        "match_pairs",
    ):
        return norm_user == normalize(str(correct_value))

    elif ex_type in (ExerciseType.TYPE_ANSWER, "type_answer"):
        if norm_user == normalize(str(correct_value)):
            return True
        accepted_list = exercise.correct_answer.get("accepted", [])
        for accepted in accepted_list:
            if norm_user == normalize(str(accepted)):
                return True
        return False

    else:
        raise ValueError(f"Unknown exercise type: {ex_type}")
