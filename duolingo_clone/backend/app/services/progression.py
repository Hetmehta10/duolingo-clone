"""Progression, exercise selection, and achievement calculation business logic."""

from __future__ import annotations

import random
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Achievement,
    DailyXP,
    Exercise,
    ExerciseType,
    LessonSession,
    SessionStatus,
    Skill,
    Unit,
    User,
    UserAchievement,
    UserSkillProgress,
    UserUnitProgress,
    UserState,
)
from app.services import streaks
from app.utils.timeutils import now_ist

XP_PER_LESSON = 10
XP_PERFECT_BONUS = 5
XP_PRACTICE = 5
XP_LEGENDARY = 40
LEGENDARY_EXERCISE_COUNT = 10
LEGENDARY_MISTAKE_LIMIT = 3


def build_legendary_exercises(db: Session, unit: Unit) -> List[Exercise]:
    """Sample 10 exercises across all skills in the unit for a legendary challenge.

    Guarantees all 5 exercise types are present, never includes duplicate match_pairs,
    and ensures match_pairs never opens the challenge at index 0.
    """
    all_exercises = db.execute(
        select(Exercise).join(Skill).where(Skill.unit_id == unit.id)
    ).scalars().all()

    if not all_exercises:
        raise ValueError(f"Unit {unit.id} has no exercises.")

    by_type: Dict[str, List[Exercise]] = {}
    for ex in all_exercises:
        type_key = ex.exercise_type.value if hasattr(ex.exercise_type, "value") else str(ex.exercise_type)
        by_type.setdefault(type_key, []).append(ex)

    chosen: List[Exercise] = []
    chosen_ids = set()

    # Pick 1 from each available type (guaranteeing all 5 types)
    for ex_type, pool in by_type.items():
        if pool:
            picked = random.choice(pool)
            chosen.append(picked)
            chosen_ids.add(picked.id)

    # Pick remaining non-match_pairs exercises up to LEGENDARY_EXERCISE_COUNT (10)
    remaining_non_match = [
        ex for ex in all_exercises
        if ex.id not in chosen_ids
        and (ex.exercise_type.value if hasattr(ex.exercise_type, "value") else str(ex.exercise_type)) not in (ExerciseType.MATCH_PAIRS.value, "match_pairs")
    ]

    while len(chosen) < LEGENDARY_EXERCISE_COUNT and remaining_non_match:
        picked = random.choice(remaining_non_match)
        chosen.append(picked)
        chosen_ids.add(picked.id)
        remaining_non_match.remove(picked)

    # Fallback to any remaining exercises if needed
    if len(chosen) < LEGENDARY_EXERCISE_COUNT:
        remaining_any = [ex for ex in all_exercises if ex.id not in chosen_ids]
        while len(chosen) < LEGENDARY_EXERCISE_COUNT and remaining_any:
            picked = random.choice(remaining_any)
            chosen.append(picked)
            chosen_ids.add(picked.id)
            remaining_any.remove(picked)

    random.shuffle(chosen)

    # Force any match_pairs exercise out of index 0
    if chosen:
        first_type = chosen[0].exercise_type.value if hasattr(chosen[0].exercise_type, "value") else str(chosen[0].exercise_type)
        if first_type in (ExerciseType.MATCH_PAIRS.value, "match_pairs"):
            for i in range(1, len(chosen)):
                itype = chosen[i].exercise_type.value if hasattr(chosen[i].exercise_type, "value") else str(chosen[i].exercise_type)
                if itype not in (ExerciseType.MATCH_PAIRS.value, "match_pairs"):
                    chosen[0], chosen[i] = chosen[i], chosen[0]
                    break

    return chosen


def complete_legendary(db: Session, user: User, unit: Unit, mistakes: int) -> Dict[str, Any]:
    """Evaluate a legendary challenge session.

    If mistakes >= LEGENDARY_MISTAKE_LIMIT (3), the attempt fails with 0 XP.
    Otherwise marks unit as legendary, credits XP_LEGENDARY, and updates streak.
    """
    if mistakes >= LEGENDARY_MISTAKE_LIMIT:
        return {
            "legendary_passed": False,
            "xp_awarded": 0,
            "is_legendary": False,
        }

    unit_prog = db.execute(
        select(UserUnitProgress).where(
            UserUnitProgress.user_id == user.id,
            UserUnitProgress.unit_id == unit.id,
        )
    ).scalar_one_or_none()

    if unit_prog is None:
        unit_prog = UserUnitProgress(
            user_id=user.id,
            unit_id=unit.id,
            is_legendary=True,
            legendary_completed_at=now_ist(),
        )
        db.add(unit_prog)
    else:
        unit_prog.is_legendary = True
        unit_prog.legendary_completed_at = now_ist()

    xp_awarded = XP_LEGENDARY
    user.state.total_xp += xp_awarded
    streaks.register_activity(db, user, xp_awarded)

    return {
        "legendary_passed": True,
        "xp_awarded": xp_awarded,
        "is_legendary": True,
    }


def build_session_exercises(db: Session, skill: Skill) -> List[Exercise]:
    """Assemble a balanced, pedagogical set of 6 exercises for an active lesson.

    Pedagogical integrity requires variety across all 5 exercise formats (multiple choice,
    word bank translation, pair matching, fill-in-the-blank, and free typing) within every
    practice session. The 6th exercise is chosen from remaining available exercises,
    strictly avoiding duplicate match-pair exercises because pair matching has high visual
    cognitive weight. The final sequence is shuffled, ensuring match pairs never opens
    the lesson at index 0.

    Returns a list of 6 Exercise ORM instances ready for session play.
    """
    all_exercises = db.execute(
        select(Exercise).where(Exercise.skill_id == skill.id)
    ).scalars().all()

    if not all_exercises:
        raise ValueError(f"Skill {skill.id} has no exercises.")

    # Group exercises by type
    by_type: Dict[str, List[Exercise]] = {}
    for ex in all_exercises:
        type_key = ex.exercise_type.value if hasattr(ex.exercise_type, "value") else str(ex.exercise_type)
        by_type.setdefault(type_key, []).append(ex)

    chosen: List[Exercise] = []
    chosen_ids = set()

    # Pick 1 from each available type (guaranteeing all 5 types)
    for ex_type, pool in by_type.items():
        if pool:
            picked = random.choice(pool)
            chosen.append(picked)
            chosen_ids.add(picked.id)

    # Pick 1 more from remaining pool to reach 6, strictly avoiding match_pairs
    remaining_non_match = [
        ex for ex in all_exercises
        if ex.id not in chosen_ids
        and (ex.exercise_type.value if hasattr(ex.exercise_type, "value") else str(ex.exercise_type)) not in (ExerciseType.MATCH_PAIRS.value, "match_pairs")
    ]

    if remaining_non_match and len(chosen) < 6:
        picked_extra = random.choice(remaining_non_match)
        chosen.append(picked_extra)
        chosen_ids.add(picked_extra.id)
    elif len(chosen) < 6:
        # Fallback to any remaining non-chosen exercise if necessary
        remaining_any = [ex for ex in all_exercises if ex.id not in chosen_ids]
        if remaining_any:
            picked_extra = random.choice(remaining_any)
            chosen.append(picked_extra)
            chosen_ids.add(picked_extra.id)

    random.shuffle(chosen)

    # Force any match_pairs exercise out of index 0
    if chosen:
        first_type = chosen[0].exercise_type.value if hasattr(chosen[0].exercise_type, "value") else str(chosen[0].exercise_type)
        if first_type in (ExerciseType.MATCH_PAIRS.value, "match_pairs"):
            for i in range(1, len(chosen)):
                itype = chosen[i].exercise_type.value if hasattr(chosen[i].exercise_type, "value") else str(chosen[i].exercise_type)
                if itype not in (ExerciseType.MATCH_PAIRS.value, "match_pairs"):
                    chosen[0], chosen[i] = chosen[i], chosen[0]
                    break

    return chosen


def advance_progress(db: Session, user: User, skill: Skill, perfect: bool, is_practice: bool = False) -> Dict[str, Any]:
    """Advance the learner's crown level, unlock sequential skills, and credit XP.

    Increments lessons completed in the current level. When the required lessons are met,
    the crown level increases and the lesson counter resets. If the skill reaches max
    crown level, it is marked completed and the subsequent skill along the course path
    is unlocked. Base XP and an optional flawless session bonus are awarded to the user.

    Returns a summary dictionary with XP awarded, level changes, and unlocked skill IDs.
    """
    progress = db.execute(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == user.id,
            UserSkillProgress.skill_id == skill.id,
        )
    ).scalar_one_or_none()

    if progress is None:
        progress = UserSkillProgress(
            user_id=user.id,
            skill_id=skill.id,
            crown_level=0,
            lessons_done_in_level=0,
            is_unlocked=True,
            completed_at=None,
        )
        db.add(progress)
        db.flush()

    if is_practice or progress.crown_level >= skill.max_crown_level:
        xp_awarded = XP_PRACTICE
        user.state.total_xp += xp_awarded
        streaks.register_activity(db, user, xp_awarded)
        return {
            "xp_awarded": xp_awarded,
            "crown_level": progress.crown_level,
            "lessons_done_in_level": progress.lessons_done_in_level,
            "leveled_up": False,
            "skill_completed": False,
            "unlocked_skill_id": None,
        }

    leveled_up = False
    skill_completed = False
    unlocked_skill_id: Optional[int] = None

    progress.lessons_done_in_level += 1

    if progress.lessons_done_in_level >= skill.lessons_per_level and progress.crown_level < skill.max_crown_level:
        progress.crown_level += 1
        progress.lessons_done_in_level = 0
        leveled_up = True

        if progress.crown_level == skill.max_crown_level:
            progress.completed_at = now_ist()
            skill_completed = True

            # Unlock next skill ordered across course by (Unit.order_index, Skill.order_index)
            all_course_skills = db.execute(
                select(Skill)
                .join(Unit, Skill.unit_id == Unit.id)
                .order_by(Unit.order_index.asc(), Skill.order_index.asc())
            ).scalars().all()

            skill_ids = [s.id for s in all_course_skills]
            if skill.id in skill_ids:
                curr_idx = skill_ids.index(skill.id)
                if curr_idx + 1 < len(all_course_skills):
                    next_skill = all_course_skills[curr_idx + 1]
                    next_prog = db.execute(
                        select(UserSkillProgress).where(
                            UserSkillProgress.user_id == user.id,
                            UserSkillProgress.skill_id == next_skill.id,
                        )
                    ).scalar_one_or_none()
                    if next_prog is None:
                        next_prog = UserSkillProgress(
                            user_id=user.id,
                            skill_id=next_skill.id,
                            crown_level=0,
                            lessons_done_in_level=0,
                            is_unlocked=True,
                        )
                        db.add(next_prog)
                    else:
                        next_prog.is_unlocked = True
                    unlocked_skill_id = next_skill.id

    xp_awarded = XP_PER_LESSON + (XP_PERFECT_BONUS if perfect else 0)
    user.state.total_xp += xp_awarded
    streaks.register_activity(db, user, xp_awarded)

    return {
        "xp_awarded": xp_awarded,
        "crown_level": progress.crown_level,
        "lessons_done_in_level": progress.lessons_done_in_level,
        "leveled_up": leveled_up,
        "skill_completed": skill_completed,
        "unlocked_skill_id": unlocked_skill_id,
    }


def recalc_achievements(db: Session, user: User) -> List[UserAchievement]:
    """Evaluate achievement criteria against current user metrics and unlock qualifying badges.

    Aggregates user telemetry (current streak, total cumulative XP, earned crowns, completed
    and flawless sessions, and sustained daily goal consistency). Compares these metrics
    against each achievement's unlocking threshold. Badges crossing their threshold for the
    first time receive an IST timestamp.

    Returns a list of UserAchievement records that were newly unlocked during this invocation.
    """
    state: UserState = user.state

    # 1. Calculate metric values
    current_streak = state.current_streak
    total_xp = state.total_xp

    total_crowns = db.execute(
        select(func.coalesce(func.sum(UserSkillProgress.crown_level), 0)).where(
            UserSkillProgress.user_id == user.id
        )
    ).scalar() or 0

    completed_sessions_count = db.execute(
        select(func.count(LessonSession.id)).where(
            LessonSession.user_id == user.id,
            LessonSession.status == SessionStatus.COMPLETED,
        )
    ).scalar() or 0

    perfect_sessions_count = db.execute(
        select(func.count(LessonSession.id)).where(
            LessonSession.user_id == user.id,
            LessonSession.status == SessionStatus.COMPLETED,
            LessonSession.hearts_lost == 0,
        )
    ).scalar() or 0

    strategist_days_count = db.execute(
        select(func.count(DailyXP.id)).where(
            DailyXP.user_id == user.id,
            DailyXP.xp_earned >= state.daily_goal_xp,
        )
    ).scalar() or 0

    # 2. Fetch all achievements and user's achievement records
    achievements = db.execute(select(Achievement)).scalars().all()
    user_achievements = db.execute(
        select(UserAchievement)
        .options(joinedload(UserAchievement.achievement))
        .where(UserAchievement.user_id == user.id)
    ).scalars().all()

    ua_by_code = {ua.achievement.code: ua for ua in user_achievements if ua.achievement}

    newly_earned: List[UserAchievement] = []

    for ach in achievements:
        ua = ua_by_code.get(ach.code)
        if ua is None:
            ua = UserAchievement(
                user_id=user.id,
                achievement_id=ach.id,
                progress=0,
                earned_at=None,
            )
            ua.achievement = ach
            db.add(ua)
            db.flush()

        # Update progress for tracked achievements
        if ach.code == "wildfire":
            ua.progress = current_streak
        elif ach.code == "sage":
            ua.progress = total_xp
        elif ach.code == "regal":
            ua.progress = int(total_crowns)
        elif ach.code == "champion":
            ua.progress = int(completed_sessions_count)
        elif ach.code == "sharpshooter":
            ua.progress = int(perfect_sessions_count)
        elif ach.code == "strategist":
            ua.progress = int(strategist_days_count)
        # scholar and photogenic leave progress untouched

        # Check unlock condition
        if ua.progress >= ach.threshold and ua.earned_at is None:
            ua.earned_at = now_ist()
            newly_earned.append(ua)

    return newly_earned
