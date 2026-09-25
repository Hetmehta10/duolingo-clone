"""SQLAlchemy 2.x ORM models for the Duolingo clone database schema.

Defines all tables, columns, indexes, foreign key constraints, and bidirectional relationships
with cascade rules for data integrity.
"""

from __future__ import annotations

import enum
from datetime import date, datetime
from typing import Any, List, Optional

from app.utils.timeutils import now_ist, today_ist

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExerciseType(str, enum.Enum):
    """Enumeration of allowed exercise types in the pool."""
    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE_WORD_BANK = "translate_word_bank"
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


class SessionStatus(str, enum.Enum):
    """Enumeration of lesson session lifecycle statuses."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class User(Base):
    """Stores user identity, basic profile configuration, and default learner flag."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_color: Mapped[str] = mapped_column(String(30), nullable=False)
    is_default_learner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_ist, nullable=False)

    # 1:1 relationship with gamification state
    state: Mapped[UserState] = relationship(
        "UserState",
        uselist=False,
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # 1:N relationships
    skill_progress: Mapped[List[UserSkillProgress]] = relationship(
        "UserSkillProgress",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    unit_progress: Mapped[List[UserUnitProgress]] = relationship(
        "UserUnitProgress",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    lesson_sessions: Mapped[List[LessonSession]] = relationship(
        "LessonSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    daily_xp: Mapped[List[DailyXP]] = relationship(
        "DailyXP",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    achievements: Mapped[List[UserAchievement]] = relationship(
        "UserAchievement",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserState(Base):
    """Stores gamification state separate from user identity (XP, gems, hearts, streaks)."""

    __tablename__ = "user_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    total_xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gems: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    hearts: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_ist, nullable=False)
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=50, nullable=False)

    # Relationship back to User
    user: Mapped[User] = relationship("User", back_populates="state")


class Course(Base):
    """Represents a language learning course track (e.g. Spanish from English)."""

    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    from_language: Mapped[str] = mapped_column(String(50), nullable=False)
    to_language: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)

    # 1:N relationship with units
    units: Mapped[List[Unit]] = relationship(
        "Unit",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Unit.order_index",
    )


class Unit(Base):
    """Represents a thematic unit within a course (e.g. Basics, Phrases, Travel)."""

    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    theme_color: Mapped[str] = mapped_column(String(30), nullable=False)

    # Relationships
    course: Mapped[Course] = relationship("Course", back_populates="units")
    skills: Mapped[List[Skill]] = relationship(
        "Skill",
        back_populates="unit",
        cascade="all, delete-orphan",
        order_by="Skill.order_index",
    )
    user_progress: Mapped[List[UserUnitProgress]] = relationship(
        "UserUnitProgress",
        back_populates="unit",
        cascade="all, delete-orphan",
    )
    lesson_sessions: Mapped[List[LessonSession]] = relationship(
        "LessonSession",
        back_populates="unit",
        cascade="all, delete-orphan",
    )


class Skill(Base):
    """Represents a specific skill node within a unit containing exercise pools and crown levels."""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    unit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("units.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    icon_name: Mapped[str] = mapped_column(String(50), nullable=False)
    max_crown_level: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    lessons_per_level: Mapped[int] = mapped_column(Integer, default=2, nullable=False)

    # Relationships
    unit: Mapped[Unit] = relationship("Unit", back_populates="skills")
    exercises: Mapped[List[Exercise]] = relationship(
        "Exercise",
        back_populates="skill",
        cascade="all, delete-orphan",
        order_by="Exercise.order_index",
    )
    user_progress: Mapped[List[UserSkillProgress]] = relationship(
        "UserSkillProgress",
        back_populates="skill",
        cascade="all, delete-orphan",
    )
    lesson_sessions: Mapped[List[LessonSession]] = relationship(
        "LessonSession",
        back_populates="skill",
        cascade="all, delete-orphan",
    )


class Exercise(Base):
    """Represents an exercise belonging to a skill's exercise pool."""

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    skill_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    exercise_type: Mapped[ExerciseType] = mapped_column(
        SQLEnum(ExerciseType, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answer: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    options: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    hint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    skill: Mapped[Skill] = relationship("Skill", back_populates="exercises")
    session_answers: Mapped[List[SessionAnswer]] = relationship(
        "SessionAnswer",
        back_populates="exercise",
        cascade="all, delete-orphan",
    )


class UserSkillProgress(Base):
    """Tracks learner crown level and completion status for each skill."""

    __tablename__ = "user_skill_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    skill_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    crown_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lessons_done_in_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_unlocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="skill_progress")
    skill: Mapped[Skill] = relationship("Skill", back_populates="user_progress")


class UserUnitProgress(Base):
    """Tracks legendary status for each unit for a user."""

    __tablename__ = "user_unit_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "unit_id", name="uq_user_unit"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    unit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("units.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    is_legendary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    legendary_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="unit_progress")
    unit: Mapped[Unit] = relationship("Unit", back_populates="user_progress")


class LessonSession(Base):
    """Represents an active or completed practice session.

    A session targets either a single skill (a normal lesson) or a whole unit (a legendary challenge),
    never both and never neither.
    """

    __tablename__ = "lesson_sessions"
    __table_args__ = (
        CheckConstraint("(skill_id IS NULL) <> (unit_id IS NULL)", name="ck_session_target"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    skill_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    unit_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("units.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    crown_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_practice: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_legendary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus, native_enum=False, values_callable=lambda obj: [e.value for e in obj]),
        default=SessionStatus.IN_PROGRESS,
        nullable=False,
    )
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hearts_lost: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=now_ist, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="lesson_sessions")
    skill: Mapped[Optional[Skill]] = relationship("Skill", back_populates="lesson_sessions")
    unit: Mapped[Optional[Unit]] = relationship("Unit", back_populates="lesson_sessions")
    answers: Mapped[List[SessionAnswer]] = relationship(
        "SessionAnswer",
        back_populates="session",
        cascade="all, delete-orphan",
    )


class SessionAnswer(Base):
    """Records individual exercise response within a lesson session."""

    __tablename__ = "session_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("lesson_sessions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("exercises.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_answer: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=now_ist, nullable=False)

    # Relationships
    session: Mapped[LessonSession] = relationship("LessonSession", back_populates="answers")
    exercise: Mapped[Exercise] = relationship("Exercise", back_populates="session_answers")


class DailyXP(Base):
    """Tracks cumulative daily XP earned by a user for streaks, daily goals, and leaderboards."""

    __tablename__ = "daily_xp"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_daily_xp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    user: Mapped[User] = relationship("User", back_populates="daily_xp")


class Achievement(Base):
    """Defines available achievements, unlock criteria, and reward tiers."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    icon_name: Mapped[str] = mapped_column(String(50), nullable=False)
    tier: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    threshold: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    user_achievements: Mapped[List[UserAchievement]] = relationship(
        "UserAchievement",
        back_populates="achievement",
        cascade="all, delete-orphan",
    )


class UserAchievement(Base):
    """Tracks learner progress toward and unlock timestamp for each achievement."""

    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("achievements.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    earned_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="achievements")
    achievement: Mapped[Achievement] = relationship("Achievement", back_populates="user_achievements")
