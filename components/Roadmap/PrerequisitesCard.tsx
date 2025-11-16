"use client";
import { Prerequisite, Roadmap } from "@/Types/roadmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface PrerequisitesCardProps {
  prerequisite: Prerequisite;
  roadmap: Roadmap;
}

export default function PrerequisitesCard({
  prerequisite,
  roadmap,
}: PrerequisitesCardProps) {
  // Find topic names from roadmap structure
  const getTopicName = (topicId: string): string => {
    for (const level of roadmap.structure.levels) {
      for (const section of level.sections) {
        if (section.id === topicId) {
          return section.title;
        }
        for (const subtopic of section.subtopics) {
          if (subtopic.id === topicId) {
            return subtopic.title;
          }
        }
      }
    }
    return topicId;
  };

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <CardTitle className="text-sm">Prerequisites</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Complete these before starting this topic
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {prerequisite.requiredTopics.length > 0 ? (
          <div className="space-y-2">
            {prerequisite.requiredTopics.map((topicId) => (
              <div
                key={topicId}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                <span>{getTopicName(topicId)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No prerequisites required
          </div>
        )}
        {prerequisite.skillChecks && prerequisite.skillChecks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium mb-2">Skill Checks:</div>
            <div className="flex flex-wrap gap-1">
              {prerequisite.skillChecks.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

