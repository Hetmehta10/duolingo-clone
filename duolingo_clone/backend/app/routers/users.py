"""User profile, status, and heart refill endpoints."""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.models import (
    Achievement,
    DailyXP,
    LessonSession,
    SessionStatus,
    User,
    UserAchievement,
    UserSkillProgress,
    UserState,
)
from app.schemas import (
    UserAchievementDetail,
    UserListItem,
    UserProfileResponse,
    UserTopBarResponse,
)
from app.services import hearts, streaks

router = APIRouter(prefix="/users", tags=["Users"])


def build_top_bar_payload(db: Session, user: User) -> UserTopBarResponse:
    """Helper to assemble the standard top-bar payload with synced hearts and streak data."""
    hearts.sync_hearts(db, user.state)
    streak_data = streaks.get_streak_status(db, user)
    sec_until_next = hearts.seconds_until_next_heart(user.state)

    return UserTopBarResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_color=user.avatar_color,
        total_xp=user.state.total_xp,
        gems=user.state.gems,
        hearts=user.state.hearts,
        max_hearts=hearts.MAX_HEARTS,
        seconds_until_next_heart=sec_until_next,
        current_streak=streak_data["current_streak"],
        longest_streak=streak_data["longest_streak"],
        daily_goal_xp=streak_data["daily_goal_xp"],
        xp_today=streak_data["xp_today"],
        goal_met=streak_data["goal_met"],
    )


@router.get("", response_model=List[UserListItem])
def list_users(db: Session = Depends(get_db)) -> List[UserListItem]:
    """Lists all users for the dev profile switcher and user selection."""
    users = db.execute(
        select(User).options(joinedload(User.state)).order_by(User.id.asc())
    ).scalars().all()

    return [
        UserListItem(
            id=u.id,
            username=u.username,
            display_name=u.display_name,
            avatar_color=u.avatar_color,
            is_default_learner=u.is_default_learner,
            total_xp=u.state.total_xp if u.state else 0,
        )
        for u in users
    ]


@router.get("/{user_id}", response_model=UserTopBarResponse)
def get_user_status(user_id: int, db: Session = Depends(get_db)) -> UserTopBarResponse:
    """Returns gamification state and current day progress for the application top bar."""
    user = db.execute(
        select(User).options(joinedload(User.state)).where(User.id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    return build_top_bar_payload(db, user)


@router.get("/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)) -> UserProfileResponse:
    """Returns comprehensive profile data including achievements, stats, and 7-day streak calendar."""
    user = db.execute(
        select(User)
        .options(
            joinedload(User.state),
            selectinload(User.achievements).joinedload(UserAchievement.achievement),
            selectinload(User.skill_progress),
        )
        .where(User.id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    top_bar = build_top_bar_payload(db, user)
    streak_data = streaks.get_streak_status(db, user)

    # Calculate total lessons completed and total crowns
    total_completed = db.execute(
        select(func.count(LessonSession.id)).where(
            LessonSession.user_id == user.id,
            LessonSession.status == SessionStatus.COMPLETED,
        )
    ).scalar() or 0

    total_crowns = sum(sp.crown_level for sp in user.skill_progress)

    # Format achievements
    all_achievements = db.execute(
        select(Achievement).order_by(Achievement.id.asc())
    ).scalars().all()
    user_ach_map = {ua.achievement_id: ua for ua in user.achievements}

    ach_details: List[UserAchievementDetail] = []
    for ach in all_achievements:
        ua = user_ach_map.get(ach.id)
        prog = ua.progress if ua else 0
        earned_at = ua.earned_at if ua else None
        ach_details.append(
            UserAchievementDetail(
                code=ach.code,
                title=ach.title,
                description=ach.description,
                icon_name=ach.icon_name,
                threshold=ach.threshold,
                progress=prog,
                earned_at=earned_at,
                is_earned=earned_at is not None,
            )
        )

    return UserProfileResponse(
        **top_bar.model_dump(),
        joined_at=user.created_at,
        total_lessons_completed=int(total_completed),
        total_crowns=total_crowns,
        achievements=ach_details,
        streak_calendar=streak_data["last_seven_days"],
    )


@router.post("/{user_id}/refill-hearts", response_model=UserTopBarResponse)
def refill_user_hearts(user_id: int, db: Session = Depends(get_db)) -> UserTopBarResponse:
    """Spends 350 gems to instantly restore user hearts to maximum."""
    user = db.execute(
        select(User).options(joinedload(User.state)).where(User.id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    try:
        hearts.refill_with_gems(db, user.state)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return build_top_bar_payload(db, user)
