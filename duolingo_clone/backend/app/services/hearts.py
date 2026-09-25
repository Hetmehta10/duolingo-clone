"""Heart regeneration, decrement, and gem refill business logic."""

from __future__ import annotations

from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models import UserState
from app.utils.timeutils import now_ist

MAX_HEARTS = 5
REGEN_INTERVAL_MINUTES = 240  # 4 hours per heart, as in real Duolingo
REFILL_GEM_COST = 350


def sync_hearts(db: Session, state: UserState) -> UserState:
    """Bring a learner's heart count up to date before it is read or modified.

    Hearts refill on a timer rather than on a background schedule, so this function
    recomputes the heart balance from the elapsed time since the last regeneration
    timestamp whenever hearts are about to be accessed. Any endpoint touching hearts
    must call this first to prevent operating on a stale balance.

    Returns the updated UserState instance with committed timestamp and count.
    """
    now = now_ist()
    if state.hearts >= MAX_HEARTS:
        state.hearts_updated_at = now
        db.commit()
        return state

    elapsed = now - state.hearts_updated_at
    total_seconds = max(0.0, elapsed.total_seconds())
    regened = int(total_seconds // (REGEN_INTERVAL_MINUTES * 60))
    if regened > 0:
        state.hearts = min(MAX_HEARTS, state.hearts + regened)
        if state.hearts >= MAX_HEARTS:
            state.hearts_updated_at = now
        else:
            state.hearts_updated_at += timedelta(minutes=REGEN_INTERVAL_MINUTES * regened)

    db.commit()
    return state


def lose_heart(db: Session, state: UserState) -> None:
    """Deduct a single heart when a learner makes a mistake during practice.

    If the learner had a full heart reserve prior to this mistake, this starts the
    regeneration countdown by anchoring the update timestamp to the current moment.
    The heart count cannot drop below zero.
    """
    if state.hearts >= MAX_HEARTS:
        state.hearts_updated_at = now_ist()
    state.hearts = max(0, state.hearts - 1)


def seconds_until_next_heart(state: UserState) -> Optional[int]:
    """Calculate the remaining duration until the learner automatically regains one heart.

    Returns None when the user's hearts are already full, or the remaining seconds
    in the current regeneration cycle to drive real-time countdown timers in the UI.
    """
    if state.hearts >= MAX_HEARTS:
        return None

    now = now_ist()
    elapsed = max(0.0, (now - state.hearts_updated_at).total_seconds())
    cycle_length = REGEN_INTERVAL_MINUTES * 60
    remaining = cycle_length - (elapsed % cycle_length)
    return max(0, int(remaining))


def refill_with_gems(db: Session, state: UserState) -> UserState:
    """Instantly restore a learner's hearts to maximum in exchange for gems.

    Raises ValueError if the user already has full hearts or does not possess
    enough gems to afford the refill. Deducts the gem price, restores hearts
    to 5, and resets the regeneration timer.
    """
    sync_hearts(db, state)
    if state.hearts >= MAX_HEARTS:
        raise ValueError("Hearts are already full.")
    if state.gems < REFILL_GEM_COST:
        raise ValueError(f"Not enough gems. Need {REFILL_GEM_COST} gems, but user has {state.gems}.")

    state.gems -= REFILL_GEM_COST
    state.hearts = MAX_HEARTS
    state.hearts_updated_at = now_ist()
    db.commit()
    return state
