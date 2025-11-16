"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillCheckProps {
  skill: string;
  onComplete?: (completed: boolean) => void;
}

export default function SkillCheck({ skill, onComplete }: SkillCheckProps) {
  const [status, setStatus] = useState<"pending" | "completed" | "failed">(
    "pending"
  );

  const handleClick = (newStatus: "completed" | "failed") => {
    setStatus(newStatus);
    onComplete?.(newStatus === "completed");
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Skill Check</CardTitle>
        <CardDescription className="text-xs">{skill}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Button
            variant={status === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => handleClick("completed")}
            className={cn(
              "gap-2",
              status === "completed" && "bg-green-600 hover:bg-green-700"
            )}
          >
            {status === "completed" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            I can do this
          </Button>
          <Button
            variant={status === "failed" ? "destructive" : "outline"}
            size="sm"
            onClick={() => handleClick("failed")}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Need practice
          </Button>
        </div>
        {status === "completed" && (
          <div className="mt-3 text-sm text-green-600">
            Great! You're ready to proceed.
          </div>
        )}
        {status === "failed" && (
          <div className="mt-3 text-sm text-orange-600">
            Consider reviewing prerequisites before continuing.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

