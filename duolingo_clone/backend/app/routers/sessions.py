"""Lesson session lifecycle, exercise generation, submission, and re-grading endpoints."""

from __future__ import annotations

from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Exercise,
    LessonSession,
    SessionAnswer,
    SessionStatus,
    Skill,
    User,
    UserAchievement,
    UserSkillProgress,
)
from app.schemas import (
    CompleteSessionRequest,
    CompleteSessionResponse,
    CreateSessionRequest,
    ExerciseResultItem,
    SessionExercise,
    SessionSkillInfo,
    StandardDetailResponse,
    StartSessionResponse,
    UserAchievementDetail,
)
from app.services import grading, hearts, progression, streaks
from app.utils.timeutils import now_ist

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("", response_model=StartSessionResponse)
def start_session(
    request: CreateSessionRequest,
    db: Session = Depends(get_db),
) -> StartSessionResponse:
    """Starts a new lesson session for a specific user and skill (or unit legendary challenge)."""
    user = db.execute(
        select(User).options(joinedload(User.state)).where(User.id == request.user_id)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {request.user_id} not found",
        )

    # 1. Legendary Challenge Flow (when unit_id is provided)
    if request.unit_id is not None:
        unit = db.execute(
            select(Unit).where(Unit.id == request.unit_id)
        ).scalar_one_or_none()

        if unit is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unit with ID {request.unit_id} not found",
            )

        # Check that all skills in this unit are at max crown level for this user
        unit_skills = db.execute(
            select(Skill).where(Skill.unit_id == unit.id)
        ).scalars().all()

        user_progs = db.execute(
            select(UserSkillProgress).where(
                UserSkillProgress.user_id == user.id,
                UserSkillProgress.skill_id.in_([s.id for s in unit_skills]),
            )
        ).scalars().all()
        prog_map = {p.skill_id: p for p in user_progs}

        legendary_unlocked = len(unit_skills) > 0 and all(
            prog_map.get(s.id) and prog_map[s.id].crown_level >= s.max_crown_level
            for s in unit_skills
        )

        if not legendary_unlocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="legendary_locked",
            )

        # Clear active in-progress sessions
        existing_sessions = db.execute(
            select(LessonSession).where(
                LessonSession.user_id == user.id,
                LessonSession.status == SessionStatus.IN_PROGRESS,
            )
        ).scalars().all()
        for s in existing_sessions:
            s.status = SessionStatus.FAILED
            s.completed_at = now_ist()
        db.flush()

        exercises = progression.build_legendary_exercises(db, unit)

        new_session = LessonSession(
            user_id=user.id,
            unit_id=unit.id,
            skill_id=None,
            crown_level=0,
            is_practice=False,
            is_legendary=True,
            status=SessionStatus.IN_PROGRESS,
            xp_awarded=0,
            hearts_lost=0,
            started_at=now_ist(),
            completed_at=None,
        )
        db.add(new_session)
        db.commit()

        return StartSessionResponse(
            session_id=new_session.id,
            unit=SessionSkillInfo(id=unit.id, title=unit.title),
            crown_level=0,
            hearts=user.state.hearts,
            is_legendary=True,
            exercises=[
                SessionExercise(
                    id=ex.id,
                    exercise_type=ex.exercise_type.value if hasattr(ex.exercise_type, "value") else str(ex.exercise_type),
                    prompt=ex.prompt,
                    options=ex.options,
                    hint=ex.hint,
                    correct_answer=ex.correct_answer,
                )
                for ex in exercises
            ],
        )

    # 2. Normal Skill Lesson Flow (when skill_id is provided)
    if request.skill_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either skill_id or unit_id must be specified",
        )

    skill = db.execute(
        select(Skill).where(Skill.id == request.skill_id)
    ).scalar_one_or_none()

    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill with ID {request.skill_id} not found",
        )

    # Check skill unlock status FIRST
    progress = db.execute(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == user.id,
            UserSkillProgress.skill_id == skill.id,
        )
    ).scalar_one_or_none()

    if progress is None or not progress.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="skill_locked",
        )

    # Sync hearts and check if out of hearts
    hearts.sync_hearts(db, user.state)
    if user.state.hearts <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="out_of_hearts",
        )

    # Mark existing in-progress sessions for this user as failed
    existing_sessions = db.execute(
        select(LessonSession).where(
            LessonSession.user_id == user.id,
            LessonSession.status == SessionStatus.IN_PROGRESS,
        )
    ).scalars().all()

    for s in existing_sessions:
        s.status = SessionStatus.FAILED
        s.completed_at = now_ist()
    db.flush()

    exercises = progression.build_session_exercises(db, skill)

    is_practice = (progress.crown_level == skill.max_crown_level)
    new_session = LessonSession(
        user_id=user.id,
        skill_id=skill.id,
        unit_id=None,
        crown_level=progress.crown_level,
        is_practice=is_practice,
        is_legendary=False,
        status=SessionStatus.IN_PROGRESS,
        xp_awarded=0,
        hearts_lost=0,
        started_at=now_ist(),
        completed_at=None,
    )
    db.add(new_session)
    db.commit()

    return StartSessionResponse(
        session_id=new_session.id,
        skill=SessionSkillInfo(id=skill.id, title=skill.title),
        crown_level=progress.crown_level,
        hearts=user.state.hearts,
        is_legendary=False,
        exercises=[
            SessionExercise(
                id=ex.id,
                exercise_type=ex.exercise_type.value if hasattr(ex.exercise_type, "value") else str(ex.exercise_type),
                prompt=ex.prompt,
                options=ex.options,
                hint=ex.hint,
                correct_answer=ex.correct_answer,
            )
            for ex in exercises
        ],
    )


@router.post("/{session_id}/complete", response_model=CompleteSessionResponse)
def complete_session(
    session_id: int,
    request: CompleteSessionRequest,
    db: Session = Depends(get_db),
) -> CompleteSessionResponse:
    """Completes and authoritatively evaluates an active lesson session."""
    session = db.execute(
        select(LessonSession)
        .options(
            joinedload(LessonSession.user).joinedload(User.state),
            joinedload(LessonSession.skill),
            joinedload(LessonSession.unit),
        )
        .where(LessonSession.id == session_id)
    ).scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID {session_id} not found",
        )

    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not in progress",
        )

    # 1. LEGENDARY SESSION COMPLETION PATH
    if session.is_legendary:
        unit_exercises = db.execute(
            select(Exercise).join(Skill).where(Skill.unit_id == session.unit_id)
        ).scalars().all()
        exercise_map = {ex.id: ex for ex in unit_exercises}

        for answer_item in request.answers:
            if answer_item.exercise_id not in exercise_map:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Exercise ID {answer_item.exercise_id} does not belong to legendary unit {session.unit_id}",
                )

        results: List[ExerciseResultItem] = []
        mistakes = 0

        for answer_item in request.answers:
            ex = exercise_map[answer_item.exercise_id]
            is_correct = grading.check_answer(ex, answer_item.user_answer)
            results.append(ExerciseResultItem(exercise_id=ex.id, is_correct=is_correct))

            session_answer = SessionAnswer(
                session_id=session.id,
                exercise_id=ex.id,
                user_answer=answer_item.user_answer,
                is_correct=is_correct,
                answered_at=now_ist(),
            )
            db.add(session_answer)

            if not is_correct:
                mistakes += 1

        total_answers = len(results)
        correct_count = sum(1 for r in results if r.is_correct)
        accuracy_pct = int(round((correct_count / total_answers) * 100)) if total_answers > 0 else 0
        now = now_ist()

        leg_res = progression.complete_legendary(db, session.user, session.unit, mistakes)

        if not leg_res["legendary_passed"]:
            session.status = SessionStatus.FAILED
            session.xp_awarded = 0
            session.completed_at = now
            db.commit()

            streak_data = streaks.get_streak_status(db, session.user)
            return CompleteSessionResponse(
                status=SessionStatus.FAILED.value,
                xp_awarded=0,
                hearts_remaining=session.user.state.hearts,
                hearts_lost=mistakes,
                perfect=False,
                accuracy_pct=accuracy_pct,
                crown_level=0,
                leveled_up=False,
                skill_completed=False,
                unlocked_skill_id=None,
                is_practice=False,
                is_legendary=True,
                legendary_passed=False,
                total_xp=session.user.state.total_xp,
                current_streak=session.user.state.current_streak,
                xp_today=streak_data["xp_today"],
                daily_goal_xp=streak_data["daily_goal_xp"],
                goal_met=streak_data["goal_met"],
                new_achievements=[],
                results=results,
            )

        session.status = SessionStatus.COMPLETED
        session.xp_awarded = leg_res["xp_awarded"]
        session.completed_at = now

        new_achievements_entities = progression.recalc_achievements(db, session.user)
        db.commit()

        new_achievements_details: List[UserAchievementDetail] = [
            UserAchievementDetail(
                code=ua.achievement.code,
                title=ua.achievement.title,
                description=ua.achievement.description,
                icon_name=ua.achievement.icon_name,
                threshold=ua.achievement.threshold,
                progress=ua.progress,
                earned_at=ua.earned_at,
                is_earned=True,
            )
            for ua in new_achievements_entities
            if ua.achievement
        ]

        streak_data = streaks.get_streak_status(db, session.user)

        return CompleteSessionResponse(
            status=SessionStatus.COMPLETED.value,
            xp_awarded=leg_res["xp_awarded"],
            hearts_remaining=session.user.state.hearts,
            hearts_lost=mistakes,
            perfect=(mistakes == 0),
            accuracy_pct=accuracy_pct,
            crown_level=0,
            leveled_up=False,
            skill_completed=False,
            unlocked_skill_id=None,
            is_practice=False,
            is_legendary=True,
            legendary_passed=True,
            total_xp=session.user.state.total_xp,
            current_streak=session.user.state.current_streak,
            xp_today=streak_data["xp_today"],
            daily_goal_xp=streak_data["daily_goal_xp"],
            goal_met=streak_data["goal_met"],
            new_achievements=new_achievements_details,
            results=results,
        )

    # 2. NORMAL SESSION COMPLETION PATH
    hearts.sync_hearts(db, session.user.state)

    skill_exercises = db.execute(
        select(Exercise).where(Exercise.skill_id == session.skill_id)
    ).scalars().all()
    exercise_map = {ex.id: ex for ex in skill_exercises}

    for answer_item in request.answers:
        if answer_item.exercise_id not in exercise_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exercise ID {answer_item.exercise_id} does not belong to session skill {session.skill_id}",
            )

    results: List[ExerciseResultItem] = []
    hearts_lost = 0

    for answer_item in request.answers:
        ex = exercise_map[answer_item.exercise_id]
        is_correct = grading.check_answer(ex, answer_item.user_answer)
        results.append(ExerciseResultItem(exercise_id=ex.id, is_correct=is_correct))

        session_answer = SessionAnswer(
            session_id=session.id,
            exercise_id=ex.id,
            user_answer=answer_item.user_answer,
            is_correct=is_correct,
            answered_at=now_ist(),
        )
        db.add(session_answer)

        if not is_correct:
            hearts_lost += 1
            if session.user.state.hearts > 0:
                hearts.lose_heart(db, session.user.state)

    session.hearts_lost = hearts_lost

    total_answers = len(results)
    correct_count = sum(1 for r in results if r.is_correct)
    accuracy_pct = int(round((correct_count / total_answers) * 100)) if total_answers > 0 else 0
    now = now_ist()

    if session.user.state.hearts <= 0:
        session.status = SessionStatus.FAILED
        session.xp_awarded = 0
        session.completed_at = now
        db.commit()

        streak_data = streaks.get_streak_status(db, session.user)
        return CompleteSessionResponse(
            status=SessionStatus.FAILED.value,
            xp_awarded=0,
            hearts_remaining=session.user.state.hearts,
            hearts_lost=hearts_lost,
            perfect=False,
            accuracy_pct=accuracy_pct,
            crown_level=session.crown_level,
            leveled_up=False,
            skill_completed=False,
            unlocked_skill_id=None,
            is_practice=session.is_practice,
            is_legendary=False,
            legendary_passed=False,
            total_xp=session.user.state.total_xp,
            current_streak=session.user.state.current_streak,
            xp_today=streak_data["xp_today"],
            daily_goal_xp=streak_data["daily_goal_xp"],
            goal_met=streak_data["goal_met"],
            new_achievements=[],
            results=results,
        )

    session.status = SessionStatus.COMPLETED
    session.completed_at = now
    perfect = (hearts_lost == 0)

    prog_data = progression.advance_progress(db, session.user, session.skill, perfect=perfect, is_practice=session.is_practice)
    session.xp_awarded = prog_data["xp_awarded"]

    new_achievements_entities = progression.recalc_achievements(db, session.user)
    db.commit()

    new_achievements_details: List[UserAchievementDetail] = [
        UserAchievementDetail(
            code=ua.achievement.code,
            title=ua.achievement.title,
            description=ua.achievement.description,
            icon_name=ua.achievement.icon_name,
            threshold=ua.achievement.threshold,
            progress=ua.progress,
            earned_at=ua.earned_at,
            is_earned=True,
        )
        for ua in new_achievements_entities
        if ua.achievement
    ]

    streak_data = streaks.get_streak_status(db, session.user)

    return CompleteSessionResponse(
        status=SessionStatus.COMPLETED.value,
        xp_awarded=prog_data["xp_awarded"],
        hearts_remaining=session.user.state.hearts,
        hearts_lost=hearts_lost,
        perfect=perfect,
        accuracy_pct=accuracy_pct,
        crown_level=prog_data["crown_level"],
        leveled_up=prog_data["leveled_up"],
        skill_completed=prog_data["skill_completed"],
        unlocked_skill_id=prog_data["unlocked_skill_id"],
        is_practice=session.is_practice,
        is_legendary=False,
        legendary_passed=True,
        total_xp=session.user.state.total_xp,
        current_streak=session.user.state.current_streak,
        xp_today=streak_data["xp_today"],
        daily_goal_xp=streak_data["daily_goal_xp"],
        goal_met=streak_data["goal_met"],
        new_achievements=new_achievements_details,
        results=results,
    )


@router.post("/{session_id}/abandon", response_model=StandardDetailResponse)
def abandon_session(
    session_id: int,
    db: Session = Depends(get_db),
) -> StandardDetailResponse:
    """Abandons an in-progress session, marking it failed with no penalties."""
    session = db.execute(
        select(LessonSession).where(LessonSession.id == session_id)
    ).scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID {session_id} not found",
        )

    if session.status == SessionStatus.IN_PROGRESS:
        session.status = SessionStatus.FAILED
        session.completed_at = now_ist()
        db.commit()

    return StandardDetailResponse(status="failed", detail="Session abandoned")
