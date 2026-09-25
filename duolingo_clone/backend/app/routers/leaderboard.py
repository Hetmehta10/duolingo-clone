"""Leaderboard rankings endpoint."""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, UserState
from app.schemas import LeaderboardEntry, LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse)
def get_leaderboard(
    user_id: Optional[int] = Query(None, description="Optional ID of current user to highlight"),
    limit: int = Query(10, ge=1, le=50, description="Max number of ranked entries to return"),
    db: Session = Depends(get_db),
) -> LeaderboardResponse:
    """Returns the top learners sorted live by total XP with ID tie-break.
    
    Uses database-level ordering without pulling all users into memory.
    """
    ranked_users = db.execute(
        select(User)
        .join(UserState, User.id == UserState.user_id)
        .options(joinedload(User.state))
        .order_by(UserState.total_xp.desc(), User.id.asc())
        .limit(limit)
    ).scalars().all()

    entries: List[LeaderboardEntry] = []
    current_user_rank: Optional[int] = None

    for rank_idx, user in enumerate(ranked_users, start=1):
        is_curr = (user_id is not None and user.id == user_id)
        if is_curr:
            current_user_rank = rank_idx

        entries.append(
            LeaderboardEntry(
                rank=rank_idx,
                user_id=user.id,
                username=user.username,
                display_name=user.display_name,
                avatar_color=user.avatar_color,
                total_xp=user.state.total_xp if user.state else 0,
                is_current_user=is_curr,
            )
        )

    # If current user was not in the top slice, find their absolute rank
    if user_id is not None and current_user_rank is None:
        target_user = db.execute(
            select(User).options(joinedload(User.state)).where(User.id == user_id)
        ).scalar_one_or_none()
        if target_user and target_user.state:
            higher_count = db.execute(
                select(UserState).where(
                    (UserState.total_xp > target_user.state.total_xp)
                    | ((UserState.total_xp == target_user.state.total_xp) & (UserState.user_id < target_user.id))
                )
            ).scalars().all()
            current_user_rank = len(higher_count) + 1

    return LeaderboardResponse(
        entries=entries,
        current_user_rank=current_user_rank,
    )
