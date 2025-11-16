import { RoadmapStructure, RoadmapLevel, RoadmapSection, RoadmapSubtopic, PrerequisitesMap } from '@/Types/roadmap';

export interface TimelineWeek {
  weekNumber: number;
  startDate?: Date;
  endDate?: Date;
  items: TimelineItem[];
  totalHours: number;
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  type: 'level' | 'section' | 'subtopic';
  estimatedHours: number;
  prerequisites?: string[];
  levelId?: string;
  sectionId?: string;
}

/**
 * Converts hierarchical roadmap structure to a linear timeline
 */
export function generateTimeline(
  structure: RoadmapStructure,
  prerequisites?: PrerequisitesMap,
  startDate?: Date
): TimelineWeek[] {
  const timelineItems: TimelineItem[] = [];
  const weeks: TimelineWeek[] = [];
  
  // Flatten structure into linear items with prerequisites
  structure.levels.forEach(level => {
    level.sections.forEach(section => {
      section.subtopics.forEach(subtopic => {
        const prereqs = prerequisites?.[subtopic.id]?.requiredTopics || 
                       prerequisites?.[section.id]?.requiredTopics || 
                       [];
        
        timelineItems.push({
          id: subtopic.id,
          title: subtopic.title,
          description: subtopic.description,
          type: 'subtopic',
          estimatedHours: subtopic.estimatedHours || 2,
          prerequisites: prereqs,
          levelId: level.id,
          sectionId: section.id,
        });
      });
    });
  });

  // Sort items based on prerequisites (topological sort)
  const sortedItems = topologicalSort(timelineItems, prerequisites || {});

  // Group into weeks (assuming ~20 hours per week)
  const hoursPerWeek = 20;
  let currentWeek: TimelineWeek = {
    weekNumber: 1,
    items: [],
    totalHours: 0,
  };

  let currentDate = startDate ? new Date(startDate) : new Date();
  
  sortedItems.forEach(item => {
    // If adding this item would exceed weekly hours, start a new week
    if (currentWeek.totalHours + item.estimatedHours > hoursPerWeek && currentWeek.items.length > 0) {
      // Set end date for current week
      currentWeek.endDate = new Date(currentDate);
      weeks.push(currentWeek);
      
      // Start new week
      currentDate = new Date(currentWeek.endDate);
      currentDate.setDate(currentDate.getDate() + 1); // Start next week
      currentWeek = {
        weekNumber: weeks.length + 1,
        startDate: new Date(currentDate),
        items: [],
        totalHours: 0,
      };
    }

    currentWeek.items.push(item);
    currentWeek.totalHours += item.estimatedHours;
  });

  // Add the last week
  if (currentWeek.items.length > 0) {
    currentWeek.endDate = new Date(currentDate);
    // Add days based on estimated hours
    const daysToAdd = Math.ceil(currentWeek.totalHours / (hoursPerWeek / 7));
    currentWeek.endDate.setDate(currentWeek.endDate.getDate() + daysToAdd);
    weeks.push(currentWeek);
  }

  // Set start dates for all weeks
  weeks.forEach((week, index) => {
    if (index === 0 && startDate) {
      week.startDate = new Date(startDate);
    } else if (index > 0 && weeks[index - 1].endDate) {
      const nextStart = new Date(weeks[index - 1].endDate!);
      nextStart.setDate(nextStart.getDate() + 1);
      week.startDate = nextStart;
    }
    
    if (!week.endDate && week.startDate) {
      const daysToAdd = Math.ceil(week.totalHours / (hoursPerWeek / 7));
      week.endDate = new Date(week.startDate);
      week.endDate.setDate(week.endDate.getDate() + daysToAdd);
    }
  });

  return weeks;
}

/**
 * Topological sort to order items based on prerequisites
 */
function topologicalSort(
  items: TimelineItem[],
  prerequisites: PrerequisitesMap
): TimelineItem[] {
  const sorted: TimelineItem[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const itemMap = new Map<string, TimelineItem>();
  
  // Create map for quick lookup
  items.forEach(item => {
    itemMap.set(item.id, item);
  });

  // Check for cycles
  function hasCycle(itemId: string): boolean {
    if (visiting.has(itemId)) {
      return true; // Cycle detected
    }
    if (visited.has(itemId)) {
      return false;
    }

    visiting.add(itemId);
    const prereqs = prerequisites[itemId]?.requiredTopics || [];
    
    for (const prereqId of prereqs) {
      if (hasCycle(prereqId)) {
        return true;
      }
    }

    visiting.delete(itemId);
    visited.add(itemId);
    return false;
  }

  // Detect cycles
  for (const item of items) {
    if (hasCycle(item.id)) {
      console.warn(`Cycle detected involving item: ${item.id}`);
      // Break cycle by removing problematic prerequisites
      if (prerequisites[item.id]) {
        prerequisites[item.id].requiredTopics = [];
      }
    }
  }

  // Reset visited sets
  visited.clear();
  visiting.clear();

  // Topological sort
  function visit(itemId: string) {
    if (visited.has(itemId)) {
      return;
    }
    if (visiting.has(itemId)) {
      // Cycle detected, skip this dependency
      return;
    }

    visiting.add(itemId);
    const prereqs = prerequisites[itemId]?.requiredTopics || [];
    
    // Visit prerequisites first
    prereqs.forEach(prereqId => {
      if (itemMap.has(prereqId)) {
        visit(prereqId);
      }
    });

    visiting.delete(itemId);
    visited.add(itemId);

    const item = itemMap.get(itemId);
    if (item && !sorted.find(i => i.id === itemId)) {
      sorted.push(item);
    }
  }

  // Visit all items
  items.forEach(item => {
    if (!visited.has(item.id)) {
      visit(item.id);
    }
  });

  return sorted;
}

/**
 * Estimates total timeline duration
 */
export function estimateTimelineDuration(structure: RoadmapStructure, hoursPerWeek: number = 20): {
  totalWeeks: number;
  totalHours: number;
  estimatedCompletionDate: Date;
} {
  const totalHours = structure.metadata?.totalEstimatedHours || 
    structure.levels.reduce((sum, level) => {
      const levelHours = level.estimatedHours || 
        level.sections.reduce((sSum, section) => {
          const sectionHours = section.estimatedHours || 
            section.subtopics.reduce((stSum, st) => stSum + (st.estimatedHours || 2), 0);
          return sSum + sectionHours;
        }, 0);
      return sum + levelHours;
    }, 0);

  const totalWeeks = Math.ceil(totalHours / hoursPerWeek);
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + (totalWeeks * 7));

  return {
    totalWeeks,
    totalHours,
    estimatedCompletionDate,
  };
}

