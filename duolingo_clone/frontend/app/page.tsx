"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getCourse } from "@/lib/api";
import { CourseOverview, SkillOverview } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import { UnitHeader } from "@/components/path/UnitHeader";
import { PathNode } from "@/components/path/PathNode";
import { NodePopover } from "@/components/path/NodePopover";
import { LegendaryNode } from "@/components/path/LegendaryNode";
import { Mascot } from "@/components/ui/Mascot";
import { DailyGoalCard, DevSwitcherCard } from "@/components/layout/RightRail";

const ZIGZAG_PATTERN = [0, -1, -2, -1, 0, 1, 2, 1];

export default function WindingPathPage() {
  const { user, userId, isLoading } = useUser();
  const [courseData, setCourseData] = useState<CourseOverview | null>(null);
  const [courseLoading, setCourseLoading] = useState<boolean>(true);
  const [activePopoverSkillId, setActivePopoverSkillId] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!userId) return;
    setCourseLoading(true);
    getCourse(userId)
      .then((data) => {
        setCourseData(data);
      })
      .catch((err) => {
        console.error("Failed to load course path:", err);
      })
      .finally(() => {
        setCourseLoading(false);
      });
  }, [userId, user]);

  // Find the first node across the whole course that is 'in_progress' or 'available'
  let currentSkillId: number | null = null;
  if (courseData) {
    for (const unit of courseData.units) {
      for (const skill of unit.skills) {
        if (skill.state === "in_progress" || skill.state === "available") {
          currentSkillId = skill.id;
          break;
        }
      }
      if (currentSkillId !== null) break;
    }
  }

  // Pre-calculate running globalIndex across all units for global path calculation
  let runningGlobalIndex = 0;
  const step = isDesktop ? 45 : 32;

  return (
    <AppShell>
      {courseLoading || isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-feather border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          {/* Mobile Daily Goal Card (<1200px) */}
          <div className="w-full max-w-md mb-6 min-[1200px]:hidden">
            <DailyGoalCard />
          </div>

          {courseData?.units.map((unit) => {
            return (
              <div key={unit.id} className="w-full mb-12 flex flex-col items-center">
                {/* Sticky Unit Header */}
                <UnitHeader
                  orderIndex={unit.order_index}
                  title={unit.title}
                  description={unit.description}
                  themeColor={unit.theme_color}
                />

                {/* Winding Zigzag Nodes */}
                <div className="w-full flex flex-col items-center gap-7 pt-4 pb-8">
                  {unit.skills.map((skill: SkillOverview, unitNodeIndex: number) => {
                    const globalIndex = runningGlobalIndex++;
                    const patternOffset = ZIGZAG_PATTERN[globalIndex % ZIGZAG_PATTERN.length];
                    const offsetX = patternOffset * step;
                    const isCurrent = skill.id === currentSkillId;
                    const isPopoverOpen = activePopoverSkillId === skill.id;

                    // Mascot placed beside unit's middle node (index 1 of a 3-skill unit)
                    // on side opposite its offset (hidden on mobile)
                    const isMiddleNodeOfUnit = unitNodeIndex === Math.floor(unit.skills.length / 2);
                    const mascotSideIsRight = patternOffset <= 0;

                    return (
                      <div
                        key={skill.id}
                        className="relative flex items-center justify-center"
                        style={{
                          transform: `translateX(${offsetX}px)`,
                        }}
                      >
                        {/* Mascot beside path for unit's middle node (desktop only) */}
                        {isMiddleNodeOfUnit && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 pointer-events-none hidden md:block"
                            style={{
                              [mascotSideIsRight ? "left" : "right"]: "115px",
                            }}
                          >
                            <Mascot mood="idle" size={90} />
                          </div>
                        )}

                        {/* The Path Node */}
                        <PathNode
                          skill={skill}
                          unitThemeColor={unit.theme_color}
                          isCurrent={isCurrent}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePopoverSkillId(
                              isPopoverOpen ? null : skill.id
                            );
                          }}
                        />

                        {/* Node Popover */}
                        {isPopoverOpen && (
                          <NodePopover
                            skill={skill}
                            unitThemeColor={unit.theme_color}
                            onClose={() => setActivePopoverSkillId(null)}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Legendary Unit Trophy Node at end of unit (offset 0) */}
                  <LegendaryNode unit={unit} />
                </div>
              </div>
            );
          })}

          {/* Mobile Dev Switcher Card (<1200px) */}
          <div className="w-full max-w-md mt-4 mb-8 min-[1200px]:hidden">
            <DevSwitcherCard />
          </div>
        </div>
      )}
    </AppShell>
  );
}
