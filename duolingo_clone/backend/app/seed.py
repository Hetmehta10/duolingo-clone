"""Seed script for initializing the Duolingo clone database with courses, exercises, users, and progress.

Idempotent: Checks if data already exists in the users table before executing.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import (
    Achievement,
    Course,
    DailyXP,
    Exercise,
    ExerciseType,
    LessonSession,
    SessionAnswer,
    Skill,
    Unit,
    User,
    UserAchievement,
    UserSkillProgress,
    UserUnitProgress,
    UserState,
)
from app.utils.timeutils import now_ist, today_ist

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def seed_db(db: Session) -> bool:
    """Populates the database with initial seed data if the database is empty.
    
    Returns True if seeded, False if skipped because records already exist.
    """
    # Idempotency check: if users already exist, return early
    existing_user = db.query(User).first()
    if existing_user is not None:
        logger.info("Database already contains user records. Skipping seed.")
        return False

    logger.info("Starting database seed process...")
    today = today_ist()
    now = now_ist()

    # 1. Create Course: Spanish from English
    course = Course(
        from_language="en",
        to_language="es",
        title="Spanish",
    )
    db.add(course)
    db.flush()

    # 2. Create Units and Skills
    # Unit 1: Basics (#58cc02)
    unit1 = Unit(
        course_id=course.id,
        order_index=1,
        title="Basics",
        description="Get started with the fundamentals of Spanish",
        theme_color="#58cc02",
    )
    db.add(unit1)
    db.flush()

    skill_greetings = Skill(
        unit_id=unit1.id,
        order_index=1,
        title="Greetings",
        icon_name="hand_wave",
        max_crown_level=5,
        lessons_per_level=2,
    )
    skill_basics1 = Skill(
        unit_id=unit1.id,
        order_index=2,
        title="Basics 1",
        icon_name="book_open",
        max_crown_level=5,
        lessons_per_level=2,
    )
    skill_basics2 = Skill(
        unit_id=unit1.id,
        order_index=3,
        title="Basics 2",
        icon_name="coffee",
        max_crown_level=5,
        lessons_per_level=2,
    )

    # Unit 2: Phrases (#1cb0f6)
    unit2 = Unit(
        course_id=course.id,
        order_index=2,
        title="Phrases",
        description="Express common thoughts, order food, and name animals",
        theme_color="#1cb0f6",
    )
    db.add(unit2)
    db.flush()

    skill_phrases = Skill(
        unit_id=unit2.id,
        order_index=1,
        title="Common Phrases",
        icon_name="chat_bubble",
        max_crown_level=5,
        lessons_per_level=2,
    )
    skill_food = Skill(
        unit_id=unit2.id,
        order_index=2,
        title="Food",
        icon_name="apple",
        max_crown_level=5,
        lessons_per_level=2,
    )
    skill_animals = Skill(
        unit_id=unit2.id,
        order_index=3,
        title="Animals",
        icon_name="paw",
        max_crown_level=5,
        lessons_per_level=2,
    )

    # Unit 3: Travel (#ce82ff)
    unit3 = Unit(
        course_id=course.id,
        order_index=3,
        title="Travel",
        description="Navigate places, talk about family, and count numbers",
        theme_color="#ce82ff",
    )
    db.add(unit3)
    db.flush()

    skill_travel = Skill(
        unit_id=unit3.id,
        order_index=1,
        title="Travel",
        icon_name="airplane",
        max_crown_level=5,
        lessons_per_level=2,
    )
    skill_family = Skill(
        unit_id=unit3.id,
        order_index=2,
        title="Family",
        icon_name="people",
        max_crown_level=5,
        lessons_per_level=2,
    )
    skill_numbers = Skill(
        unit_id=unit3.id,
        order_index=3,
        title="Numbers",
        icon_name="hashtag",
        max_crown_level=5,
        lessons_per_level=2,
    )

    all_skills = [
        skill_greetings,
        skill_basics1,
        skill_basics2,
        skill_phrases,
        skill_food,
        skill_animals,
        skill_travel,
        skill_family,
        skill_numbers,
    ]
    db.add_all(all_skills)
    db.flush()

    # 3. Create Exercises (Exactly 10 per skill: 2 of each of the 5 types)
    # Skill 1: Greetings
    exercises_data: List[Dict[str, Any]] = [
        # Skill 1: Greetings
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'Hello'?",
            "options": {"choices": ["Hola", "Adiós", "Gracias", "Por favor"]},
            "correct_answer": {"value": "Hola"},
            "hint": "Common greeting used at any time of day.",
            "order_index": 1,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'Goodbye'?",
            "options": {"choices": ["Adiós", "Buenas noches", "Hola", "De nada"]},
            "correct_answer": {"value": "Adiós"},
            "hint": "Said when departing.",
            "order_index": 2,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: Good morning, how are you?",
            "options": {"bank": ["Buenos", "días,", "¿cómo", "estás?", "noches", "adiós", "tardes"]},
            "correct_answer": {"value": "Buenos días, ¿cómo estás?"},
            "hint": "Polite morning greeting and inquiry.",
            "order_index": 3,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: Nice to meet you",
            "options": {"bank": ["Mucho", "gusto", "en", "conocerte", "gracias", "hola"]},
            "correct_answer": {"value": "Mucho gusto en conocerte"},
            "hint": "Expressing pleasure upon meeting someone.",
            "order_index": 4,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["Hola", "Hello"],
                    ["Adiós", "Goodbye"],
                    ["Gracias", "Thank you"],
                    ["Buenas tardes", "Good afternoon"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Match Spanish greetings with their English counterparts.",
            "order_index": 5,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["Buenos días", "Good morning"],
                    ["Buenas noches", "Good night"],
                    ["Hasta luego", "See you later"],
                    ["Por favor", "Please"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Match each daily polite expression.",
            "order_index": 6,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "¡Buenos ___! ¿Cómo amaneciste?",
            "options": {"choices": ["días", "tardes", "noches"]},
            "correct_answer": {"value": "días"},
            "hint": "The greeting used before noon.",
            "order_index": 7,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Muchas ___ por tu ayuda.",
            "options": {"choices": ["gracias", "noches", "por favor"]},
            "correct_answer": {"value": "gracias"},
            "hint": "Expressing appreciation.",
            "order_index": 8,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: Good morning",
            "options": None,
            "correct_answer": {"value": "Buenos días", "accepted": ["Buenos dias", "buenos dias", "buenos días"]},
            "hint": "Morning salutation.",
            "order_index": 9,
        },
        {
            "skill": skill_greetings,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: Thank you very much",
            "options": None,
            "correct_answer": {"value": "Muchas gracias", "accepted": ["muchas gracias", "Muchas Gracias"]},
            "hint": "Polite expression of deep gratitude.",
            "order_index": 10,
        },

        # Skill 2: Basics 1
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the boy'?",
            "options": {"choices": ["el niño", "la niña", "el hombre", "la mujer"]},
            "correct_answer": {"value": "el niño"},
            "hint": "Masculine child.",
            "order_index": 1,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the woman'?",
            "options": {"choices": ["la mujer", "el hombre", "la niña", "el perro"]},
            "correct_answer": {"value": "la mujer"},
            "hint": "Feminine adult.",
            "order_index": 2,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: I am a boy",
            "options": {"bank": ["Yo", "soy", "un", "niño", "una", "niña", "hombre"]},
            "correct_answer": {"value": "Yo soy un niño"},
            "hint": "First-person identity followed by boy.",
            "order_index": 3,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: The girl drinks water",
            "options": {"bank": ["La", "niña", "bebe", "agua", "come", "el", "hombre"]},
            "correct_answer": {"value": "La niña bebe agua"},
            "hint": "A person drinking a liquid.",
            "order_index": 4,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el hombre", "the man"],
                    ["la mujer", "the woman"],
                    ["el niño", "the boy"],
                    ["la niña", "the girl"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Match Spanish persons to English translations.",
            "order_index": 5,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["yo", "I"],
                    ["tú", "you"],
                    ["él", "he"],
                    ["ella", "she"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Match personal pronouns.",
            "order_index": 6,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Yo ___ estudiante.",
            "options": {"choices": ["soy", "eres", "es"]},
            "correct_answer": {"value": "soy"},
            "hint": "First person singular of ser.",
            "order_index": 7,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Ella ___ una niña.",
            "options": {"choices": ["es", "soy", "eres"]},
            "correct_answer": {"value": "es"},
            "hint": "Third person singular of ser.",
            "order_index": 8,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: The man",
            "options": None,
            "correct_answer": {"value": "El hombre", "accepted": ["el hombre", "El Hombre"]},
            "hint": "Masculine singular adult.",
            "order_index": 9,
        },
        {
            "skill": skill_basics1,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: I am a woman",
            "options": None,
            "correct_answer": {"value": "Yo soy una mujer", "accepted": ["yo soy una mujer", "Soy una mujer", "soy una mujer"]},
            "hint": "First-person statement of female identity.",
            "order_index": 10,
        },

        # Skill 3: Basics 2
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the bread'?",
            "options": {"choices": ["el pan", "el agua", "la leche", "la manzana"]},
            "correct_answer": {"value": "el pan"},
            "hint": "Baked staple food.",
            "order_index": 1,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the milk'?",
            "options": {"choices": ["la leche", "el pan", "el agua", "el queso"]},
            "correct_answer": {"value": "la leche"},
            "hint": "Dairy drink.",
            "order_index": 2,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: The boy drinks milk",
            "options": {"bank": ["El", "niño", "bebe", "leche", "gato", "come", "agua"]},
            "correct_answer": {"value": "El niño bebe leche"},
            "hint": "Action is drinking milk.",
            "order_index": 3,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: I eat bread",
            "options": {"bank": ["Yo", "como", "pan", "bebo", "leche", "tú", "comes"]},
            "correct_answer": {"value": "Yo como pan"},
            "hint": "'Comer' in first person singular.",
            "order_index": 4,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el agua", "the water"],
                    ["el pan", "the bread"],
                    ["la leche", "the milk"],
                    ["el queso", "the cheese"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Match foods and drinks.",
            "order_index": 5,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["comer", "to eat"],
                    ["beber", "to drink"],
                    ["el arroz", "the rice"],
                    ["la manzana", "the apple"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Match verbs and food nouns.",
            "order_index": 6,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Tú ___ agua todos los días.",
            "options": {"choices": ["bebes", "bebo", "bebe"]},
            "correct_answer": {"value": "bebes"},
            "hint": "Second person singular conjugation.",
            "order_index": 7,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Nosotros ___ pan fresco.",
            "options": {"choices": ["comemos", "como", "come"]},
            "correct_answer": {"value": "comemos"},
            "hint": "'Nosotros' takes -emos ending.",
            "order_index": 8,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: The water",
            "options": None,
            "correct_answer": {"value": "El agua", "accepted": ["el agua", "El Agua"]},
            "hint": "Stressed initial 'a' takes masculine article.",
            "order_index": 9,
        },
        {
            "skill": skill_basics2,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: She eats apples",
            "options": None,
            "correct_answer": {"value": "Ella come manzanas", "accepted": ["ella come manzanas", "Ella come manzanas."]},
            "hint": "Third-person subject eating plural fruit.",
            "order_index": 10,
        },

        # Skill 4: Common Phrases
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'Excuse me'?",
            "options": {"choices": ["Disculpe", "Hola", "Adiós", "De nada"]},
            "correct_answer": {"value": "Disculpe"},
            "hint": "Polite interjection to get attention.",
            "order_index": 1,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'You are welcome'?",
            "options": {"choices": ["De nada", "Por favor", "Gracias", "Perdón"]},
            "correct_answer": {"value": "De nada"},
            "hint": "Standard response to 'gracias'.",
            "order_index": 2,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: I do not speak Spanish",
            "options": {"bank": ["Yo", "no", "hablo", "español", "inglés", "habla", "mucho"]},
            "correct_answer": {"value": "Yo no hablo español"},
            "hint": "Negation 'no' comes before verb.",
            "order_index": 3,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: Do you speak English?",
            "options": {"bank": ["¿Hablas", "tú", "inglés?", "español", "hablo", "usted"]},
            "correct_answer": {"value": "¿Hablas tú inglés?"},
            "hint": "Question format.",
            "order_index": 4,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["Por favor", "Please"],
                    ["De nada", "You're welcome"],
                    ["Perdón", "Pardon / Sorry"],
                    ["Sí", "Yes"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Polite conversational words.",
            "order_index": 5,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["No entiendo", "I don't understand"],
                    ["¿Cómo te llamas?", "What is your name?"],
                    ["Me llamo", "My name is"],
                    ["Mucho gusto", "Pleased to meet you"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Match conversation starters.",
            "order_index": 6,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "¿___ está el baño?",
            "options": {"choices": ["Dónde", "Cómo", "Quién"]},
            "correct_answer": {"value": "Dónde"},
            "hint": "Asking for a location.",
            "order_index": 7,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Lo siento, no ___ la pregunta.",
            "options": {"choices": ["entiendo", "entender", "entiende"]},
            "correct_answer": {"value": "entiendo"},
            "hint": "First person singular of entender.",
            "order_index": 8,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: Please",
            "options": None,
            "correct_answer": {"value": "Por favor", "accepted": ["por favor", "Por Favor"]},
            "hint": "Two words.",
            "order_index": 9,
        },
        {
            "skill": skill_phrases,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: What is your name?",
            "options": None,
            "correct_answer": {"value": "¿Cómo te llamas?", "accepted": ["Como te llamas", "¿Como te llamas?", "como te llamas"]},
            "hint": "Involves llamar.",
            "order_index": 10,
        },

        # Skill 5: Food
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the apple'?",
            "options": {"choices": ["la manzana", "el perro", "la casa", "el gato"]},
            "correct_answer": {"value": "la manzana"},
            "hint": "Red or green fruit.",
            "order_index": 1,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the cheese'?",
            "options": {"choices": ["el queso", "la sopa", "el pollo", "el jugo"]},
            "correct_answer": {"value": "el queso"},
            "hint": "Yellow dairy product.",
            "order_index": 2,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: I want to eat chicken",
            "options": {"bank": ["Yo", "quiero", "comer", "pollo", "pescado", "arroz", "beber"]},
            "correct_answer": {"value": "Yo quiero comer pollo"},
            "hint": "'Quiero' expresses desire.",
            "order_index": 3,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: The coffee is very hot",
            "options": {"bank": ["El", "café", "está", "muy", "caliente", "frío", "té"]},
            "correct_answer": {"value": "El café está muy caliente"},
            "hint": "Coffee with temperature descriptor.",
            "order_index": 4,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el pollo", "the chicken"],
                    ["el pescado", "the fish"],
                    ["la sopa", "the soup"],
                    ["el arroz", "the rice"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Main meal dishes.",
            "order_index": 5,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el café", "the coffee"],
                    ["el té", "the tea"],
                    ["el jugo", "the juice"],
                    ["el vino", "the wine"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Beverages and drinks.",
            "order_index": 6,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Me gusta tomar ___ de naranja en el desayuno.",
            "options": {"choices": ["jugo", "sopa", "carne"]},
            "correct_answer": {"value": "jugo"},
            "hint": "Orange beverage.",
            "order_index": 7,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "¿Quieres una ensalada con ___?",
            "options": {"choices": ["tomate", "café", "agua"]},
            "correct_answer": {"value": "tomate"},
            "hint": "Common salad ingredient.",
            "order_index": 8,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: The apple",
            "options": None,
            "correct_answer": {"value": "La manzana", "accepted": ["la manzana", "La Manzana"]},
            "hint": "Feminine fruit noun.",
            "order_index": 9,
        },
        {
            "skill": skill_food,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: I like tea",
            "options": None,
            "correct_answer": {"value": "Me gusta el té", "accepted": ["me gusta el te", "Me gusta el te", "me gusta el té"]},
            "hint": "Expressing personal preference for a hot beverage.",
            "order_index": 10,
        },

        # Skill 6: Animals
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the dog'?",
            "options": {"choices": ["el perro", "el gato", "el caballo", "el pájaro"]},
            "correct_answer": {"value": "el perro"},
            "hint": "Man's best friend.",
            "order_index": 1,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the cat'?",
            "options": {"choices": ["el gato", "el perro", "el ratón", "el oso"]},
            "correct_answer": {"value": "el gato"},
            "hint": "Purrs and catches mice.",
            "order_index": 2,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: The cat drinks water",
            "options": {"bank": ["El", "gato", "bebe", "agua", "leche", "perro", "come"]},
            "correct_answer": {"value": "El gato bebe agua"},
            "hint": "Animal doing an action.",
            "order_index": 3,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: The horse runs fast",
            "options": {"bank": ["El", "caballo", "corre", "rápido", "lento", "perro", "salta"]},
            "correct_answer": {"value": "El caballo corre rápido"},
            "hint": "Running equines.",
            "order_index": 4,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el perro", "the dog"],
                    ["el gato", "the cat"],
                    ["el caballo", "the horse"],
                    ["el pájaro", "the bird"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Common domestic animals.",
            "order_index": 5,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el elefante", "the elephant"],
                    ["el león", "the lion"],
                    ["el oso", "the bear"],
                    ["el ratón", "the mouse"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Wild animals and small creatures.",
            "order_index": 6,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "El ___ vuela en el cielo.",
            "options": {"choices": ["pájaro", "perro", "pez"]},
            "correct_answer": {"value": "pájaro"},
            "hint": "Creature with wings.",
            "order_index": 7,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Tengo un ___ blanco y juguetón.",
            "options": {"choices": ["perro", "pájaro", "león"]},
            "correct_answer": {"value": "perro"},
            "hint": "Playful companion.",
            "order_index": 8,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: The cat",
            "options": None,
            "correct_answer": {"value": "El gato", "accepted": ["el gato", "El Gato"]},
            "hint": "Masculine feline.",
            "order_index": 9,
        },
        {
            "skill": skill_animals,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: I have a dog",
            "options": None,
            "correct_answer": {"value": "Tengo un perro", "accepted": ["tengo un perro", "Yo tengo un perro", "yo tengo un perro"]},
            "hint": "Tener in first person + dog.",
            "order_index": 10,
        },

        # Skill 7: Travel
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the airport'?",
            "options": {"choices": ["el aeropuerto", "la estación", "el hotel", "el taxi"]},
            "correct_answer": {"value": "el aeropuerto"},
            "hint": "Where planes take off.",
            "order_index": 1,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the hotel'?",
            "options": {"choices": ["el hotel", "el avión", "el boleto", "el pasaporte"]},
            "correct_answer": {"value": "el hotel"},
            "hint": "Place to lodge while traveling.",
            "order_index": 2,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: I need a taxi to the hotel",
            "options": {"bank": ["Necesito", "un", "taxi", "al", "hotel", "aeropuerto", "quiero", "el"]},
            "correct_answer": {"value": "Necesito un taxi al hotel"},
            "hint": "Asking for transport.",
            "order_index": 3,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: Where is my passport?",
            "options": {"bank": ["¿Dónde", "está", "mi", "pasaporte?", "boleto", "tu", "maleta"]},
            "correct_answer": {"value": "¿Dónde está mi pasaporte?"},
            "hint": "Locating important travel document.",
            "order_index": 4,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el boleto", "the ticket"],
                    ["el pasaporte", "the passport"],
                    ["la maleta", "the suitcase"],
                    ["el avión", "the airplane"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Essential travel items.",
            "order_index": 5,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el tren", "the train"],
                    ["la estación", "the station"],
                    ["el autobús", "the bus"],
                    ["la calle", "the street"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Ground transport terms.",
            "order_index": 6,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Tengo una reserva en este ___.",
            "options": {"choices": ["hotel", "avión", "boleto"]},
            "correct_answer": {"value": "hotel"},
            "hint": "Place where rooms are reserved.",
            "order_index": 7,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "El ___ sale a las ocho de la mañana.",
            "options": {"choices": ["vuelo", "pasaporte", "maleta"]},
            "correct_answer": {"value": "vuelo"},
            "hint": "Flight departing.",
            "order_index": 8,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: The passport",
            "options": None,
            "correct_answer": {"value": "El pasaporte", "accepted": ["el pasaporte", "El Pasaporte"]},
            "hint": "Official identification document for border crossings.",
            "order_index": 9,
        },
        {
            "skill": skill_travel,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: A ticket, please",
            "options": None,
            "correct_answer": {"value": "Un boleto, por favor", "accepted": ["un boleto por favor", "Un boleto por favor", "un boleto, por favor"]},
            "hint": "Polite request for boarding access.",
            "order_index": 10,
        },

        # Skill 8: Family
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the mother'?",
            "options": {"choices": ["la madre", "el padre", "la hermana", "la abuela"]},
            "correct_answer": {"value": "la madre"},
            "hint": "Female parent.",
            "order_index": 1,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'the brother'?",
            "options": {"choices": ["el hermano", "la hermana", "el padre", "el hijo"]},
            "correct_answer": {"value": "el hermano"},
            "hint": "Male sibling.",
            "order_index": 2,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: My family is very big",
            "options": {"bank": ["Mi", "familia", "es", "muy", "grande", "pequeña", "tu", "son"]},
            "correct_answer": {"value": "Mi familia es muy grande"},
            "hint": "Describing family size.",
            "order_index": 3,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: My brother has two sons",
            "options": {"bank": ["Mi", "hermano", "tiene", "dos", "hijos", "hijas", "padre", "tres"]},
            "correct_answer": {"value": "Mi hermano tiene dos hijos"},
            "hint": "Sibling relationship.",
            "order_index": 4,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el padre", "the father"],
                    ["la madre", "the mother"],
                    ["el hijo", "the son"],
                    ["la hija", "the daughter"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Immediate family members.",
            "order_index": 5,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["el abuelo", "the grandfather"],
                    ["la abuela", "the grandmother"],
                    ["el tío", "the uncle"],
                    ["la tía", "the aunt"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Extended family relatives.",
            "order_index": 6,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Mi ___ cocina una comida deliciosa.",
            "options": {"choices": ["madre", "boleto", "perro"]},
            "correct_answer": {"value": "madre"},
            "hint": "Parent cooking.",
            "order_index": 7,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Mis ___ viven en una casa bonita.",
            "options": {"choices": ["abuelos", "abuelo", "padre"]},
            "correct_answer": {"value": "abuelos"},
            "hint": "Plural subject.",
            "order_index": 8,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: My mother",
            "options": None,
            "correct_answer": {"value": "Mi madre", "accepted": ["mi madre", "Mi Madre", "Mi mamá", "mi mama"]},
            "hint": "Possessive + mother.",
            "order_index": 9,
        },
        {
            "skill": skill_family,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: The sister",
            "options": None,
            "correct_answer": {"value": "La hermana", "accepted": ["la hermana", "La Hermana"]},
            "hint": "Feminine sibling.",
            "order_index": 10,
        },

        # Skill 9: Numbers
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'three'?",
            "options": {"choices": ["tres", "dos", "cuatro", "cinco"]},
            "correct_answer": {"value": "tres"},
            "hint": "Number after two.",
            "order_index": 1,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "Which one means 'five'?",
            "options": {"choices": ["cinco", "uno", "cuatro", "seis"]},
            "correct_answer": {"value": "cinco"},
            "hint": "Count on one hand.",
            "order_index": 2,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: I have three cats and two dogs",
            "options": {"bank": ["Tengo", "tres", "gatos", "y", "dos", "perros", "cuatro", "caballos"]},
            "correct_answer": {"value": "Tengo tres gatos y dos perros"},
            "hint": "Counting multiple pets.",
            "order_index": 3,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.TRANSLATE_WORD_BANK,
            "prompt": "Translate this sentence: Table for four people, please",
            "options": {"bank": ["Mesa", "para", "cuatro", "personas,", "por", "favor", "dos", "tres"]},
            "correct_answer": {"value": "Mesa para cuatro personas, por favor"},
            "hint": "Restaurant table booking.",
            "order_index": 4,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["uno", "one"],
                    ["dos", "two"],
                    ["tres", "three"],
                    ["cuatro", "four"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Numbers 1 to 4.",
            "order_index": 5,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.MATCH_PAIRS,
            "prompt": "Tap the matching pairs",
            "options": {
                "pairs": [
                    ["cinco", "five"],
                    ["seis", "six"],
                    ["siete", "seven"],
                    ["ocho", "eight"],
                ]
            },
            "correct_answer": {"value": "all_matched"},
            "hint": "Numbers 5 to 8.",
            "order_index": 6,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Dos más dos son ___.",
            "options": {"choices": ["cuatro", "cinco", "tres"]},
            "correct_answer": {"value": "cuatro"},
            "hint": "Simple math (2 + 2).",
            "order_index": 7,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.FILL_BLANK,
            "prompt": "Una semana tiene ___ días.",
            "options": {"choices": ["siete", "ocho", "seis"]},
            "correct_answer": {"value": "siete"},
            "hint": "Days in a week.",
            "order_index": 8,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: Ten",
            "options": None,
            "correct_answer": {"value": "Diez", "accepted": ["diez", "Diez"]},
            "hint": "Number 10.",
            "order_index": 9,
        },
        {
            "skill": skill_numbers,
            "exercise_type": ExerciseType.TYPE_ANSWER,
            "prompt": "Write this in Spanish: One, two, three",
            "options": None,
            "correct_answer": {"value": "Uno, dos, tres", "accepted": ["uno, dos, tres", "Uno dos tres", "uno dos tres"]},
            "hint": "First three counting numbers.",
            "order_index": 10,
        },
    ]

    for item in exercises_data:
        skill_ref = item.pop("skill")
        exercise = Exercise(skill_id=skill_ref.id, **item)
        db.add(exercise)
    db.flush()

    # 4. Create Achievements
    achievements_specs = [
        ("wildfire", "Wildfire", "Reach a 7 day streak", "fire", 1, 7),
        ("sage", "Sage", "Earn 1000 Total XP", "sparkles", 1, 1000),
        ("scholar", "Scholar", "Learn 50 new words", "graduation_cap", 1, 50),
        ("regal", "Regal", "Earn 5 crowns across skills", "crown", 1, 5),
        ("champion", "Champion", "Complete 20 lesson sessions", "trophy", 1, 20),
        ("sharpshooter", "Sharpshooter", "Complete 5 lessons without mistakes", "target", 1, 5),
        ("photogenic", "Photogenic", "Set up your profile avatar", "camera", 1, 1),
        ("strategist", "Strategist", "Maintain a daily goal for 5 days", "lightning", 1, 5),
    ]

    achievements_map: Dict[str, Achievement] = {}
    for code, title, desc, icon, tier, thresh in achievements_specs:
        ach = Achievement(
            code=code,
            title=title,
            description=desc,
            icon_name=icon,
            tier=tier,
            threshold=thresh,
        )
        db.add(ach)
        achievements_map[code] = ach
    db.flush()

    # 5. Create Users and UserStates
    # User 1: 'het' (Default learner)
    user_het = User(
        username="het",
        display_name="Het",
        avatar_color="#58cc02",
        is_default_learner=True,
        created_at=now - timedelta(days=30),
    )
    db.add(user_het)
    db.flush()

    state_het = UserState(
        user_id=user_het.id,
        total_xp=1250,
        gems=500,
        hearts=5,
        hearts_updated_at=now,
        current_streak=7,
        longest_streak=12,
        last_activity_date=today,
        daily_goal_xp=50,
    )
    db.add(state_het)

    # 5 Leaderboard users with spread between 300 and 2400 XP
    other_users_data = [
        ("maria", "Maria", "#ff4b4b", 2400, 850, 5, 15, 20, today, 50),
        ("kenji", "Kenji", "#1cb0f6", 1820, 620, 4, 9, 14, today, 30),
        ("sofia", "Sofia", "#ce82ff", 950, 410, 5, 4, 6, today - timedelta(days=1), 50),
        ("liam", "Liam", "#ff9600", 640, 300, 3, 2, 5, today - timedelta(days=1), 20),
        ("priya", "Priya", "#2ce2a2", 350, 250, 5, 1, 3, today, 30),
    ]

    other_users: List[User] = []
    for username, d_name, av_color, total_xp, gems, hearts, streak, longest, last_act, daily_goal in other_users_data:
        u = User(
            username=username,
            display_name=d_name,
            avatar_color=av_color,
            is_default_learner=False,
            created_at=now - timedelta(days=45),
        )
        db.add(u)
        db.flush()
        s = UserState(
            user_id=u.id,
            total_xp=total_xp,
            gems=gems,
            hearts=hearts,
            hearts_updated_at=now,
            current_streak=streak,
            longest_streak=longest,
            last_activity_date=last_act,
            daily_goal_xp=daily_goal,
        )
        db.add(s)
        other_users.append(u)
    db.flush()

    # 6. Skill Progress for Default Learner ('het')
    # Greetings: crown 5 (complete), Basics 1: crown 3 (1 done), Basics 2: crown 1 (0 done),
    # Common Phrases: crown 0 (unlocked, 0 done), remaining: locked
    het_progress_config = [
        (skill_greetings, 5, 0, True, now - timedelta(days=3)),
        (skill_basics1, 3, 1, True, None),
        (skill_basics2, 1, 0, True, None),
        (skill_phrases, 0, 0, True, None),
        (skill_food, 0, 0, False, None),
        (skill_animals, 0, 0, False, None),
        (skill_travel, 0, 0, False, None),
        (skill_family, 0, 0, False, None),
        (skill_numbers, 0, 0, False, None),
    ]

    for skill, crown, done, unlocked, completed_time in het_progress_config:
        prog = UserSkillProgress(
            user_id=user_het.id,
            skill_id=skill.id,
            crown_level=crown,
            lessons_done_in_level=done,
            is_unlocked=unlocked,
            completed_at=completed_time,
        )
        db.add(prog)

    # Skill Progress for other users (plausible distributions)
    for u in other_users:
        # Maria: high progress
        if u.username == "maria":
            for idx, skill in enumerate(all_skills):
                crown = 5 if idx < 3 else (4 if idx < 6 else (2 if idx < 8 else 0))
                db.add(UserSkillProgress(
                    user_id=u.id,
                    skill_id=skill.id,
                    crown_level=crown,
                    lessons_done_in_level=0,
                    is_unlocked=(idx < 8),
                    completed_at=now - timedelta(days=10) if crown == 5 else None,
                ))
        # Kenji: mid-high progress
        elif u.username == "kenji":
            for idx, skill in enumerate(all_skills):
                crown = 4 if idx < 3 else (2 if idx < 5 else 0)
                db.add(UserSkillProgress(
                    user_id=u.id,
                    skill_id=skill.id,
                    crown_level=crown,
                    lessons_done_in_level=1 if crown > 0 else 0,
                    is_unlocked=(idx < 6),
                    completed_at=now - timedelta(days=5) if crown == 5 else None,
                ))
        # Sofia
        elif u.username == "sofia":
            for idx, skill in enumerate(all_skills):
                crown = 3 if idx < 2 else (1 if idx < 4 else 0)
                db.add(UserSkillProgress(
                    user_id=u.id,
                    skill_id=skill.id,
                    crown_level=crown,
                    lessons_done_in_level=0,
                    is_unlocked=(idx < 4),
                    completed_at=None,
                ))
        # Liam
        elif u.username == "liam":
            for idx, skill in enumerate(all_skills):
                crown = 2 if idx < 2 else 0
                db.add(UserSkillProgress(
                    user_id=u.id,
                    skill_id=skill.id,
                    crown_level=crown,
                    lessons_done_in_level=0,
                    is_unlocked=(idx < 3),
                    completed_at=None,
                ))
        # Priya
        elif u.username == "priya":
            for idx, skill in enumerate(all_skills):
                crown = 1 if idx == 0 else 0
                db.add(UserSkillProgress(
                    user_id=u.id,
                    skill_id=skill.id,
                    crown_level=crown,
                    lessons_done_in_level=0,
                    is_unlocked=(idx < 2),
                    completed_at=None,
                ))
    db.flush()

    # 6b. User Unit Progress (Legendary Status)
    all_units = [unit1, unit2, unit3]
    all_users = [user_het] + other_users
    for u in all_users:
        for unit in all_units:
            db.add(UserUnitProgress(
                user_id=u.id,
                unit_id=unit.id,
                is_legendary=False,
                legendary_completed_at=None,
            ))
    db.flush()

    # 7. Daily XP
    # 'het' has 7 continuous consecutive days of non-zero daily_xp ending today
    het_xp_history = [60, 50, 75, 50, 80, 65, 70]  # Sum = 450 XP from the last 7 days
    for day_offset, xp in enumerate(het_xp_history):
        d = today - timedelta(days=(6 - day_offset))
        db.add(DailyXP(
            user_id=user_het.id,
            date=d,
            xp_earned=xp,
        ))

    # Scattered Daily XP for others over the last 7 days
    for u in other_users:
        if u.username == "maria":
            for offset in range(7):
                db.add(DailyXP(user_id=u.id, date=today - timedelta(days=offset), xp_earned=80 + offset * 10))
        elif u.username == "kenji":
            for offset in [0, 1, 2, 3, 5, 6]:
                db.add(DailyXP(user_id=u.id, date=today - timedelta(days=offset), xp_earned=50 + offset * 5))
        elif u.username == "sofia":
            for offset in [1, 2, 4, 5]:
                db.add(DailyXP(user_id=u.id, date=today - timedelta(days=offset), xp_earned=40 + offset * 5))
        elif u.username == "liam":
            for offset in [1, 3, 6]:
                db.add(DailyXP(user_id=u.id, date=today - timedelta(days=offset), xp_earned=30))
        elif u.username == "priya":
            for offset in [0, 4]:
                db.add(DailyXP(user_id=u.id, date=today - timedelta(days=offset), xp_earned=25))
    db.flush()

    # 8. User Achievements
    # 'het': 3 earned (wildfire, sage, regal), 5 in-progress
    het_achievements = [
        ("wildfire", 7, now - timedelta(hours=2)),      # Earned
        ("sage", 1250, now - timedelta(days=1)),       # Earned
        ("regal", 9, now - timedelta(days=3)),          # Earned (total crowns: 5+3+1 = 9)
        ("scholar", 38, None),                          # In progress (thresh 50)
        ("champion", 14, None),                         # In progress (thresh 20)
        ("sharpshooter", 4, None),                      # In progress (thresh 5)
        ("photogenic", 0, None),                        # In progress (thresh 1)
        ("strategist", 3, None),                        # In progress (thresh 5)
    ]
    for code, progress, earned_time in het_achievements:
        db.add(UserAchievement(
            user_id=user_het.id,
            achievement_id=achievements_map[code].id,
            progress=progress,
            earned_at=earned_time,
        ))

    # Other users achievements
    for u in other_users:
        if u.username == "maria":
            db.add(UserAchievement(user_id=u.id, achievement_id=achievements_map["wildfire"].id, progress=15, earned_at=now - timedelta(days=5)))
            db.add(UserAchievement(user_id=u.id, achievement_id=achievements_map["sage"].id, progress=2400, earned_at=now - timedelta(days=10)))
            db.add(UserAchievement(user_id=u.id, achievement_id=achievements_map["regal"].id, progress=18, earned_at=now - timedelta(days=12)))
            db.add(UserAchievement(user_id=u.id, achievement_id=achievements_map["champion"].id, progress=20, earned_at=now - timedelta(days=2)))
        elif u.username == "kenji":
            db.add(UserAchievement(user_id=u.id, achievement_id=achievements_map["wildfire"].id, progress=9, earned_at=now - timedelta(days=2)))
            db.add(UserAchievement(user_id=u.id, achievement_id=achievements_map["sage"].id, progress=1820, earned_at=now - timedelta(days=4)))

    db.commit()
    logger.info("Database seeding completed successfully.")
    return True


def print_summary(db: Session) -> None:
    """Prints a clean tabular summary of row counts across all models in the database."""
    models_to_check = [
        ("users", User),
        ("user_states", UserState),
        ("courses", Course),
        ("units", Unit),
        ("skills", Skill),
        ("exercises", Exercise),
        ("user_skill_progress", UserSkillProgress),
        ("user_unit_progress", UserUnitProgress),
        ("lesson_sessions", LessonSession),
        ("session_answers", SessionAnswer),
        ("daily_xp", DailyXP),
        ("achievements", Achievement),
        ("user_achievements", UserAchievement),
    ]

    print("\n" + "=" * 50)
    print("      DUOLINGO CLONE DB - SEED SUMMARY")
    print("=" * 50)
    print(f"{'Table Name':<28} | {'Row Count':<12}")
    print("-" * 50)
    for table_name, model_class in models_to_check:
        count = db.query(func.count(model_class.id)).scalar() or 0
        print(f"{table_name:<28} | {count:<12}")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_db(session)
        print_summary(session)
