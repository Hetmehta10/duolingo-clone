"""Development and testing helper endpoints for simulating time progression and resetting states.

Endpoints in this router are controlled by the ENABLE_DEV_ENDPOINTS environment variable
(defaults to 'true'). When set to 'false', all routes in this module return a 404 HTTP exception.
"""

from __future__ import annotations

import os
from datetime import timedelta
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Achievement,
    DailyXP,
    LessonSession,
    Skill,
    User,
    UserAchievement,
    UserSkillProgress,
    UserState,
)
from app.utils.timeutils import now_ist, today_ist

DEV_ENDPOINTS_ENABLED = os.environ.get("ENABLE_DEV_ENDPOINTS", "true").lower() == "true"


def verify_dev_endpoints_enabled() -> None:
    """Dependency that ensures dev endpoints are active; raises 404 when disabled."""
    if not DEV_ENDPOINTS_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dev endpoints are disabled",
        )


router = APIRouter(
    prefix="/dev",
    tags=["Dev"],
    dependencies=[Depends(verify_dev_endpoints_enabled)],
)



@router.post("/advance-day")
def advance_day(
    user_id: int = Query(..., description="User ID whose calendar should be advanced"),
    days: int = Query(1, ge=1, le=365, description="Number of days to shift back activity history"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Shifts the user's last activity date and daily XP records backwards by N days.
    
    This simulates the arrival of tomorrow/future days to test streak rollover mechanics.
    """
    user = db.execute(
        select(User).options(joinedload(User.state)).where(User.id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    delta = timedelta(days=days)

    if user.state.last_activity_date:
        user.state.last_activity_date = user.state.last_activity_date - delta

    daily_xp_records = db.execute(
        select(DailyXP).where(DailyXP.user_id == user.id)
    ).scalars().all()

    for record in daily_xp_records:
        record.date = record.date - delta

    db.commit()

    return {
        "status": "success",
        "user_id": user.id,
        "days_advanced": days,
        "last_activity_date": user.state.last_activity_date.isoformat() if user.state.last_activity_date else None,
    }


@router.post("/set-hearts")
def set_hearts(
    user_id: int = Query(..., description="User ID"),
    hearts: int = Query(..., ge=0, le=5, description="Target heart count (0-5)"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Manually sets user heart count and resets the regeneration timestamp to now."""
    user = db.execute(
        select(User).options(joinedload(User.state)).where(User.id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    user.state.hearts = hearts
    user.state.hearts_updated_at = now_ist()
    db.commit()

    return {
        "status": "success",
        "user_id": user.id,
        "hearts": user.state.hearts,
        "hearts_updated_at": user.state.hearts_updated_at.isoformat(),
    }


@router.post("/reset-user")
def reset_user(
    user_id: int = Query(..., description="User ID to reset"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Wipes that user's sessions, answers, and progress, and re-applies seed defaults."""
    user = db.execute(
        select(User).options(joinedload(User.state)).where(User.id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    # 1. Clean existing records for this user
    db.execute(delete(LessonSession).where(LessonSession.user_id == user.id))
    db.execute(delete(UserSkillProgress).where(UserSkillProgress.user_id == user.id))
    db.execute(delete(DailyXP).where(DailyXP.user_id == user.id))
    db.execute(delete(UserAchievement).where(UserAchievement.user_id == user.id))
    db.flush()

    today = today_ist()
    now = now_ist()

    # 2. Reset based on user type
    if user.username == "het":
        user.state.total_xp = 1250
        user.state.gems = 500
        user.state.hearts = 5
        user.state.hearts_updated_at = now
        user.state.current_streak = 7
        user.state.longest_streak = 12
        user.state.last_activity_date = today
        user.state.daily_goal_xp = 50

        # Fetch skills ordered
        skills = db.execute(select(Skill).order_by(Skill.id.asc())).scalars().all()
        skill_map = {s.order_index if s.unit_id == 1 else s.id: s for s in skills}
        
        # Skill progress
        het_configs = [
            (skills[0], 5, 0, True, now - timedelta(days=3)),
            (skills[1], 3, 1, True, None),
            (skills[2], 1, 0, True, None),
            (skills[3], 0, 0, True, None),
            (skills[4], 0, 0, False, None),
            (skills[5], 0, 0, False, None),
            (skills[6], 0, 0, False, None),
            (skills[7], 0, 0, False, None),
            (skills[8], 0, 0, False, None),
        ]
        for sk, crown, done, unlk, comp_time in het_configs:
            db.add(UserSkillProgress(
                user_id=user.id,
                skill_id=sk.id,
                crown_level=crown,
                lessons_done_in_level=done,
                is_unlocked=unlk,
                completed_at=comp_time,
            ))

        # Daily XP
        het_xp_history = [60, 50, 75, 50, 80, 65, 70]
        for day_offset, xp in enumerate(het_xp_history):
            db.add(DailyXP(
                user_id=user.id,
                date=today - timedelta(days=(6 - day_offset)),
                xp_earned=xp,
            ))

        # Achievements
        achievements = db.execute(select(Achievement)).scalars().all()
        ach_map = {a.code: a for a in achievements}
        het_ach_specs = [
            ("wildfire", 7, now - timedelta(hours=2)),
            ("sage", 1250, now - timedelta(days=1)),
            ("regal", 9, now - timedelta(days=3)),
            ("scholar", 38, None),
            ("champion", 14, None),
            ("sharpshooter", 4, None),
            ("photogenic", 0, None),
            ("strategist", 3, None),
        ]
        for code, prog, earned in het_ach_specs:
            if code in ach_map:
                db.add(UserAchievement(
                    user_id=user.id,
                    achievement_id=ach_map[code].id,
                    progress=prog,
                    earned_at=earned,
                ))

    else:
        user.state.total_xp = 0
        user.state.gems = 500
        user.state.hearts = 5
        user.state.hearts_updated_at = now
        user.state.current_streak = 0
        user.state.longest_streak = 0
        user.state.last_activity_date = None
        user.state.daily_goal_xp = 50

        # Unlock only skill 1
        skills = db.execute(select(Skill).order_by(Skill.id.asc())).scalars().all()
        for idx, sk in enumerate(skills):
            db.add(UserSkillProgress(
                user_id=user.id,
                skill_id=sk.id,
                crown_level=0,
                lessons_done_in_level=0,
                is_unlocked=(idx == 0),
            ))

    db.commit()
    return {"status": "success", "user_id": user.id, "message": "User reset successfully"}
