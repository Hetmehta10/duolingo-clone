"""Pydantic v2 schemas for Duolingo Clone Backend API."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------
# User Schemas
# ---------------------------------------------------------

class UserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str
    avatar_color: str
    is_default_learner: bool
    total_xp: int


class UserTopBarResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str
    avatar_color: str
    total_xp: int
    gems: int
    hearts: int
    max_hearts: int = 5
    seconds_until_next_heart: Optional[int] = None
    current_streak: int
    longest_streak: int
    daily_goal_xp: int
    xp_today: int
    goal_met: bool


class StreakDayItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: str
    xp_earned: int
    goal_met: bool


class UserAchievementDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    title: str
    description: str
    icon_name: str
    threshold: int
    progress: int
    earned_at: Optional[datetime] = None
    is_earned: bool


class UserProfileResponse(UserTopBarResponse):
    joined_at: datetime
    total_lessons_completed: int
    total_crowns: int
    achievements: List[UserAchievementDetail]
    streak_calendar: List[StreakDayItem]


# ---------------------------------------------------------
# Course & Progression Schemas
# ---------------------------------------------------------

class CourseInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    from_language: str
    to_language: str


class SkillOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_index: int
    title: str
    icon_name: str
    crown_level: int
    max_crown_level: int
    lessons_done_in_level: int
    lessons_per_level: int
    is_unlocked: bool
    is_completed: bool
    state: str  # "locked" | "available" | "in_progress" | "completed"


class UnitOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_index: int
    title: str
    description: str
    theme_color: str
    skills: List[SkillOverview]
    is_legendary: bool = False
    legendary_unlocked: bool = False


class CourseOverviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course: CourseInfo
    units: List[UnitOverview]


# ---------------------------------------------------------
# Session & Exercise Schemas
# ---------------------------------------------------------

class CreateSessionRequest(BaseModel):
    user_id: int
    skill_id: Optional[int] = None
    unit_id: Optional[int] = None


class SessionSkillInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str


class SessionExercise(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exercise_type: str
    prompt: str
    options: Optional[Dict[str, Any]] = None
    hint: Optional[str] = None
    correct_answer: Dict[str, Any]


class StartSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: int
    skill: Optional[SessionSkillInfo] = None
    unit: Optional[SessionSkillInfo] = None
    crown_level: int
    hearts: int
    is_legendary: bool = False
    exercises: List[SessionExercise]


class SubmitAnswerItem(BaseModel):
    exercise_id: int
    user_answer: str


class CompleteSessionRequest(BaseModel):
    answers: List[SubmitAnswerItem]


class ExerciseResultItem(BaseModel):
    exercise_id: int
    is_correct: bool


class CompleteSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    xp_awarded: int
    hearts_remaining: int
    hearts_lost: int
    perfect: bool
    accuracy_pct: int
    crown_level: int
    leveled_up: bool
    skill_completed: bool
    unlocked_skill_id: Optional[int] = None
    is_practice: bool = False
    is_legendary: bool = False
    legendary_passed: Optional[bool] = None
    total_xp: int
    current_streak: int
    xp_today: int
    daily_goal_xp: int
    goal_met: bool
    new_achievements: List[UserAchievementDetail]
    results: List[ExerciseResultItem]


class StandardDetailResponse(BaseModel):
    status: str
    detail: Optional[str] = None


# ---------------------------------------------------------
# Leaderboard Schemas
# ---------------------------------------------------------

class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int
    user_id: int
    username: str
    display_name: str
    avatar_color: str
    total_xp: int
    is_current_user: bool


class LeaderboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entries: List[LeaderboardEntry]
    current_user_rank: Optional[int] = None
