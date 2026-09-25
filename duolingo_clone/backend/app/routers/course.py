"""Course overview and skill tree hierarchy endpoints."""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Course, Skill, Unit, User, UserSkillProgress, UserUnitProgress
from app.schemas import (
    CourseInfo,
    CourseOverviewResponse,
    SkillOverview,
    UnitOverview,
)

router = APIRouter(prefix="/course", tags=["Course"])


@router.get("", response_model=CourseOverviewResponse)
def get_course_overview(
    user_id: int = Query(..., description="ID of learner requesting the course structure"),
    db: Session = Depends(get_db),
) -> CourseOverviewResponse:
    """Returns the course structure with all units and skills decorated with the learner's progress.
    
    Uses eager loading with selectinload to avoid N+1 query overhead.
    """
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    # 1. Fetch first course with units and skills in order
    course = db.execute(
        select(Course)
        .options(
            selectinload(Course.units).selectinload(Unit.skills)
        )
        .order_by(Course.id.asc())
    ).scalars().first()

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No course found in database",
        )

    # 2. Fetch user skill progress for all skills in one query
    progress_records = db.execute(
        select(UserSkillProgress).where(UserSkillProgress.user_id == user_id)
    ).scalars().all()

    progress_map = {p.skill_id: p for p in progress_records}

    # Fetch user unit progress for all units
    unit_progress_records = db.execute(
        select(UserUnitProgress).where(UserUnitProgress.user_id == user_id)
    ).scalars().all()

    unit_progress_map = {p.unit_id: p for p in unit_progress_records}

    # 3. Assemble response
    unit_overviews: List[UnitOverview] = []
    # Sort units by order_index
    sorted_units = sorted(course.units, key=lambda u: u.order_index)

    for unit in sorted_units:
        skill_overviews: List[SkillOverview] = []
        sorted_skills = sorted(unit.skills, key=lambda s: s.order_index)

        for skill in sorted_skills:
            prog = progress_map.get(skill.id)
            crown_level = prog.crown_level if prog else 0
            lessons_done = prog.lessons_done_in_level if prog else 0
            is_unlocked = prog.is_unlocked if prog else (skill.order_index == 1 and unit.order_index == 1)
            is_completed = crown_level >= skill.max_crown_level

            # Determine state
            if not is_unlocked:
                skill_state = "locked"
            elif is_completed:
                skill_state = "completed"
            elif crown_level > 0 or lessons_done > 0:
                skill_state = "in_progress"
            else:
                skill_state = "available"

            skill_overviews.append(
                SkillOverview(
                    id=skill.id,
                    order_index=skill.order_index,
                    title=skill.title,
                    icon_name=skill.icon_name,
                    crown_level=crown_level,
                    max_crown_level=skill.max_crown_level,
                    lessons_done_in_level=lessons_done,
                    lessons_per_level=skill.lessons_per_level,
                    is_unlocked=is_unlocked,
                    is_completed=is_completed,
                    state=skill_state,
                )
            )

        u_prog = unit_progress_map.get(unit.id)
        is_legendary = u_prog.is_legendary if u_prog else False
        legendary_unlocked = len(skill_overviews) > 0 and all(s.is_completed for s in skill_overviews)

        unit_overviews.append(
            UnitOverview(
                id=unit.id,
                order_index=unit.order_index,
                title=unit.title,
                description=unit.description,
                theme_color=unit.theme_color,
                skills=skill_overviews,
                is_legendary=is_legendary,
                legendary_unlocked=legendary_unlocked,
            )
        )

    return CourseOverviewResponse(
        course=CourseInfo(
            id=course.id,
            title=course.title,
            from_language=course.from_language,
            to_language=course.to_language,
        ),
        units=unit_overviews,
    )
