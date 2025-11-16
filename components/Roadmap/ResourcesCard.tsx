"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Youtube,
  FileText,
  Code,
  DollarSign,
  GraduationCap,
  Github,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Resource {
  title: string;
  url?: string;
  description?: string;
  [key: string]: any;
}

interface ResourcesData {
  freeCourses?: Resource[];
  paidCourses?: Resource[];
  articles?: Resource[];
  documentation?: Resource[];
  videos?: Resource[];
  books?: Resource[];
  practice?: Resource[];
  githubRepos?: Resource[];
}

interface ResourcesCardProps {
  roadmapId: string;
  topicId: string;
  topicTitle: string;
}

export default function ResourcesCard({
  roadmapId,
  topicId,
  topicTitle,
}: ResourcesCardProps) {
  const [resources, setResources] = useState<ResourcesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResources, setShowResources] = useState(false);

  const fetchResources = async () => {
    if (resources) {
      setShowResources(!showResources);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `/api/roadmaps/${roadmapId}/resources/${topicId}`
      );
      setResources(response.data.resources);
      setShowResources(true);
      toast.success("Resources loaded successfully!");
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const ResourceSection = ({
    title,
    items,
    icon: Icon,
    color,
  }: {
    title: string;
    items?: Resource[];
    icon: any;
    color: string;
  }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!items || items.length === 0) return null;

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-5 w-5", color)} />
              <h4 className="font-semibold">{title}</h4>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 p-3 pt-0">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {item.title}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.provider && (
                        <Badge variant="outline" className="text-xs">
                          {item.provider}
                        </Badge>
                      )}
                      {item.platform && (
                        <Badge variant="outline" className="text-xs">
                          {item.platform}
                        </Badge>
                      )}
                      {item.channel && (
                        <Badge variant="outline" className="text-xs">
                          {item.channel}
                        </Badge>
                      )}
                      {item.author && (
                        <Badge variant="outline" className="text-xs">
                          {item.author}
                        </Badge>
                      )}
                      {item.source && (
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                      )}
                      {item.price && (
                        <Badge variant="secondary" className="text-xs">
                          {item.price}
                        </Badge>
                      )}
                      {item.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {item.duration}
                        </Badge>
                      )}
                      {item.estimatedHours && (
                        <Badge variant="secondary" className="text-xs">
                          {item.estimatedHours}h
                        </Badge>
                      )}
                      {item.stars && (
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {item.stars}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Learning Resources
            </CardTitle>
            <CardDescription>
              AI-curated resources for: <strong>{topicTitle}</strong>
            </CardDescription>
          </div>
          <Button
            onClick={fetchResources}
            disabled={loading}
            size="sm"
            variant={showResources ? "outline" : "default"}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : showResources ? (
              "Hide Resources"
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Find Resources
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {loading && (
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      )}

      {showResources && resources && (
        <CardContent className="space-y-3">
          <ResourceSection
            title="Free Courses"
            items={resources.freeCourses}
            icon={GraduationCap}
            color="text-green-600 dark:text-green-400"
          />
          <ResourceSection
            title="Paid Courses"
            items={resources.paidCourses}
            icon={DollarSign}
            color="text-yellow-600 dark:text-yellow-400"
          />
          <ResourceSection
            title="Videos"
            items={resources.videos}
            icon={Youtube}
            color="text-red-600 dark:text-red-400"
          />
          <ResourceSection
            title="Articles & Tutorials"
            items={resources.articles}
            icon={FileText}
            color="text-blue-600 dark:text-blue-400"
          />
          <ResourceSection
            title="Documentation"
            items={resources.documentation}
            icon={BookOpen}
            color="text-purple-600 dark:text-purple-400"
          />
          <ResourceSection
            title="Practice Platforms"
            items={resources.practice}
            icon={Code}
            color="text-orange-600 dark:text-orange-400"
          />
          <ResourceSection
            title="GitHub Repositories"
            items={resources.githubRepos}
            icon={Github}
            color="text-slate-600 dark:text-slate-400"
          />
          <ResourceSection
            title="Books"
            items={resources.books}
            icon={BookOpen}
            color="text-amber-600 dark:text-amber-400"
          />
        </CardContent>
      )}
    </Card>
  );
}
