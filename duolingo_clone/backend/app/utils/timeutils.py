"""Time utility functions for consistent IST (Asia/Kolkata, UTC+5:30) time base.

The database stores naive IST; there is deliberately no UTC conversion layer,
because the app serves a single region and the streak must roll at the learner's
local midnight.
"""

from datetime import date, datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))


def now_ist() -> datetime:
    """Current IST time, returned NAIVE to match how SQLite DateTime
    columns read back. All stored datetimes in this app are IST."""
    return datetime.now(IST).replace(tzinfo=None)


def today_ist() -> date:
    """Today's calendar date in IST. Streaks and daily goals roll over
    at IST midnight, matching the learner's local day."""
    return now_ist().date()
