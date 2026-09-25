export interface UserListItem {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  is_default_learner: boolean;
  total_xp: number;
}

export interface UserTopBar {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  seconds_until_next_heart: number | null;
  current_streak: number;
  longest_streak: number;
  daily_goal_xp: number;
  xp_today: number;
  goal_met: boolean;
}

export interface StreakDayItem {
  date: string;
  xp_earned: number;
  goal_met: boolean;
}

export interface UserAchievementDetail {
  code: string;
  title: string;
  description: string;
  icon_name: string;
  threshold: number;
  progress: number;
  earned_at: string | null;
  is_earned: boolean;
}

export interface UserProfile extends UserTopBar {
  joined_at: string;
  total_lessons_completed: number;
  total_crowns: number;
  achievements: UserAchievementDetail[];
  streak_calendar: StreakDayItem[];
}

export interface CourseInfo {
  id: number;
  title: string;
  from_language: string;
  to_language: string;
}

export type SkillState = "locked" | "available" | "in_progress" | "completed";

export interface SkillOverview {
  id: number;
  order_index: number;
  title: string;
  icon_name: string;
  crown_level: number;
  max_crown_level: number;
  lessons_done_in_level: number;
  lessons_per_level: number;
  is_unlocked: boolean;
  is_completed: boolean;
  state: SkillState;
}

export interface UnitOverview {
  id: number;
  order_index: number;
  title: string;
  description: string;
  theme_color: string;
  skills: SkillOverview[];
  is_legendary?: boolean;
  legendary_unlocked?: boolean;
}

export interface CourseOverview {
  course: CourseInfo;
  units: UnitOverview[];
}

export interface ExerciseOptions {
  choices?: string[];
  bank?: string[];
  pairs?: [string, string][];
}

export interface CorrectAnswerSpec {
  value: string;
  accepted?: string[];
}

export interface SessionExercise {
  id: number;
  exercise_type: "multiple_choice" | "translate_word_bank" | "match_pairs" | "fill_blank" | "type_answer";
  prompt: string;
  options: ExerciseOptions | null;
  hint: string | null;
  correct_answer: CorrectAnswerSpec;
}

export interface StartSessionResponse {
  session_id: number;
  skill?: {
    id: number;
    title: string;
  };
  unit?: {
    id: number;
    title: string;
  };
  crown_level: number;
  hearts: number;
  is_legendary?: boolean;
  exercises: SessionExercise[];
}

export interface SubmitAnswerItem {
  exercise_id: number;
  user_answer: string;
}

export interface ExerciseResultItem {
  exercise_id: number;
  is_correct: boolean;
}

export interface CompleteSessionResponse {
  status: "completed" | "failed";
  xp_awarded: number;
  hearts_remaining: number;
  hearts_lost: number;
  perfect: boolean;
  accuracy_pct: number;
  crown_level: number;
  leveled_up: boolean;
  skill_completed: boolean;
  unlocked_skill_id: number | null;
  is_practice?: boolean;
  is_legendary?: boolean;
  legendary_passed?: boolean;
  total_xp: number;
  current_streak: number;
  xp_today: number;
  daily_goal_xp: number;
  goal_met: boolean;
  new_achievements: UserAchievementDetail[];
  results: {
    exercise_id: number;
    is_correct: boolean;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  total_xp: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  current_user_rank: number | null;
}

export interface DevStatusResponse {
  status: string;
  detail?: string;
  message?: string;
  user_id?: number;
  days_advanced?: number;
  hearts?: number;
}
