"""Streak and daily XP activity tracking business logic."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DailyXP, User, UserState
from app.utils.timeutils import today_ist


def register_activity(db: Session, user: User, xp_earned: int) -> None:
    """Record learning activity for today and evaluate the user's daily streak.

    Appends or creates today's DailyXP record in the learner's local timezone (IST).
    If the learner practiced today already, the streak count remains unchanged.
    If the learner's last activity was yesterday, the streak increments by one.
    If the activity gap exceeds one day, the streak resets to 1. The longest
    historical streak is updated accordingly.
    """
    today = today_ist()
    state: UserState = user.state

    # 1. Upsert daily_xp row
    daily_xp_record = db.execute(
        select(DailyXP).where(DailyXP.user_id == user.id, DailyXP.date == today)
    ).scalar_one_or_none()

    if daily_xp_record is not None:
        daily_xp_record.xp_earned += xp_earned
    else:
        daily_xp_record = DailyXP(
            user_id=user.id,
            date=today,
            xp_earned=xp_earned,
        )
        db.add(daily_xp_record)

    # 2. Update streak status
    yesterday = today - timedelta(days=1)
    if state.last_activity_date == today:
        pass  # streak unchanged
    elif state.last_activity_date == yesterday:
        state.current_streak += 1
    else:
        state.current_streak = 1

    state.longest_streak = max(state.longest_streak, state.current_streak)
    state.last_activity_date = today


def get_streak_status(db: Session, user: User) -> Dict[str, Any]:
    """Retrieve the user's streak statistics and a contiguous 7-day activity calendar.

    Constructs a 7-day rolling window ending on today's IST date, filling missing days
    with zero XP earned. This guarantees that UI widgets and streak flame animations
    always receive an ordered, complete snapshot of recent daily goal achievements.

    Returns a dictionary with streak counts, today's XP progress, and the 7-day calendar array.
    """
    today = today_ist()
    state: UserState = user.state
    seven_days_ago = today - timedelta(days=6)

    # Fetch daily_xp for user in the 7-day range
    records = db.execute(
        select(DailyXP)
        .where(
            DailyXP.user_id == user.id,
            DailyXP.date >= seven_days_ago,
            DailyXP.date <= today,
        )
    ).scalars().all()

    xp_by_date = {r.date: r.xp_earned for r in records}

    last_seven_days: List[Dict[str, Any]] = []
    xp_today = xp_by_date.get(today, 0)
    daily_goal_xp = state.daily_goal_xp

    for day_offset in range(6, -1, -1):
        target_date = today - timedelta(days=day_offset)
        day_xp = xp_by_date.get(target_date, 0)
        last_seven_days.append({
            "date": target_date.isoformat(),
            "xp_earned": day_xp,
            "goal_met": day_xp >= daily_goal_xp,
        })

    return {
        "current_streak": state.current_streak,
        "longest_streak": state.longest_streak,
        "xp_today": xp_today,
        "daily_goal_xp": daily_goal_xp,
        "goal_met": xp_today >= daily_goal_xp,
        "last_seven_days": last_seven_days,
    }
