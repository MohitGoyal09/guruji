"use client";
import { useMemo } from "react";
import { Roadmap } from "@/Types/roadmap";
import { generateTimeline } from "@/lib/roadmap/timelineGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
  roadmap: Roadmap;
  progress?: Map<string, boolean>;
  onToggleCompletion?: (topicId: string) => void;
}

export default function TimelineView({ roadmap, progress, onToggleCompletion }: TimelineViewProps) {
  const timeline = useMemo(() => {
    return generateTimeline(roadmap.structure, roadmap.prerequisites);
  }, [roadmap]);

  const totalWeeks = timeline.length;
  const totalHours = timeline.reduce((sum, week) => sum + week.totalHours, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Overview</CardTitle>
          <CardDescription>
            Estimated learning path based on {timeline[0]?.startDate ? "your start date" : "20 hours per week"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{totalWeeks}</div>
                <div className="text-sm text-muted-foreground">Weeks</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{totalHours}</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">
                {timeline[0]?.startDate
                  ? new Date(timeline[0].startDate).toLocaleDateString()
                  : "Not started"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Breakdown */}
      <div className="space-y-4">
        {timeline.map((week, index) => {
          const completedInWeek = week.items.filter(item => progress?.get(item.id)).length;
          const weekProgress = week.items.length > 0 ? (completedInWeek / week.items.length) * 100 : 0;

          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      Week {week.weekNumber}
                    </CardTitle>
                    {completedInWeek > 0 && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {completedInWeek}/{week.items.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {week.startDate && (
                      <span>
                        {new Date(week.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {week.startDate && week.endDate && <span>-</span>}
                    {week.endDate && (
                      <span>
                        {new Date(week.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {week.items.length} topics • {week.totalHours} hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {week.items.map((item) => {
                    const isCompleted = progress?.get(item.id) || false;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border bg-card transition-colors",
                          isCompleted && "bg-green-50 dark:bg-green-950/20"
                        )}
                      >
                        {onToggleCompletion && (
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => onToggleCompletion(item.id)}
                            className="mt-0.5"
                          />
                        )}
                        <div className="flex-1">
                          <div className={cn("font-medium", isCompleted && "line-through text-muted-foreground")}>
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </div>
                          )}
                          {item.prerequisites && item.prerequisites.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Prerequisites: {item.prerequisites.length} required
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          {item.estimatedHours}h
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Weekly Progress</span>
                    <span className="font-medium">
                      {Math.round(weekProgress)}%
                    </span>
                  </div>
                  <Progress value={weekProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

