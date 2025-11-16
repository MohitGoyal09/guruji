"use client";
import { useMemo, useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Position,
  SmoothStepEdge,
  BezierEdge,
  Handle,
  ColorMode,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Roadmap } from "@/Types/roadmap";
import { cn } from "@/lib/utils";
import { getLayoutedElements } from "@/lib/roadmap/dagreLayout";
import { useTheme } from "next-themes";
import { Checkbox } from "@/components/ui/checkbox";
import TopicExplanationPanel from "./TopicExplanationPanel";
import RoadmapChatPanel from "./RoadmapChatPanel";
import RoadmapAssistant from "./RoadmapAssistant";
import {
  Database,
  Code,
  Rocket,
  BookOpen,
  Cloud,
  Zap,
  Layers,
  Target,
  CheckCircle2,
  Clock,
  GraduationCap,
  Code2,
  Globe,
  Server,
  FileCode,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";

interface GraphViewProps {
  roadmap: Roadmap;
  selectedTopicId: string | null;
  onTopicSelect: (topicId: string | null) => void;
  progress?: Map<string, boolean>;
  onToggleCompletion?: (topicId: string) => void;
}

// Icon mapping based on keywords
const getIcon = (title: string, type: "level" | "section" | "subtopic") => {
  const lowerTitle = title.toLowerCase();
  
  if (type === "level") {
    if (lowerTitle.includes("beginner") || lowerTitle.includes("fundamental")) return GraduationCap;
    if (lowerTitle.includes("intermediate")) return Layers;
    if (lowerTitle.includes("advanced") || lowerTitle.includes("expert")) return Rocket;
    return Target;
  }
  
  if (lowerTitle.includes("database") || lowerTitle.includes("sql") || lowerTitle.includes("nosql")) return Database;
  if (lowerTitle.includes("javascript") || lowerTitle.includes("js")) return Code;
  if (lowerTitle.includes("typescript") || lowerTitle.includes("ts")) return Code2;
  if (lowerTitle.includes("react") || lowerTitle.includes("vue") || lowerTitle.includes("angular")) return Zap;
  if (lowerTitle.includes("node") || lowerTitle.includes("backend") || lowerTitle.includes("server")) return Server;
  if (lowerTitle.includes("cloud") || lowerTitle.includes("aws") || lowerTitle.includes("azure")) return Cloud;
  if (lowerTitle.includes("performance") || lowerTitle.includes("optimization")) return Rocket;
  if (lowerTitle.includes("api") || lowerTitle.includes("rest") || lowerTitle.includes("graphql")) return Globe;
  if (lowerTitle.includes("test") || lowerTitle.includes("testing")) return CheckCircle2;
  if (lowerTitle.includes("deploy") || lowerTitle.includes("ci/cd")) return Rocket;
  if (lowerTitle.includes("html") || lowerTitle.includes("css")) return FileCode;
  
  return BookOpen;
};

// Color system based on level - roadmap.sh inspired with yellow/beige tones
const getLevelColor = (levelIndex: number, totalLevels: number, isDark: boolean) => {
  const progress = levelIndex / totalLevels;
  if (isDark) {
    // Dark mode: Use muted warm tones
    if (progress < 0.33) return { bg: "bg-amber-900/30", border: "border-amber-600/60", text: "text-amber-200", icon: "text-amber-400", handle: "bg-amber-500" };
    if (progress < 0.66) return { bg: "bg-orange-900/30", border: "border-orange-600/60", text: "text-orange-200", icon: "text-orange-400", handle: "bg-orange-500" };
    return { bg: "bg-yellow-900/30", border: "border-yellow-600/60", text: "text-yellow-200", icon: "text-yellow-400", handle: "bg-yellow-500" };
  } else {
    // Light mode: roadmap.sh style beige/yellow tones
    if (progress < 0.33) return { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", icon: "text-amber-700", handle: "bg-amber-500" };
    if (progress < 0.66) return { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-900", icon: "text-orange-700", handle: "bg-orange-500" };
    return { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-900", icon: "text-yellow-700", handle: "bg-yellow-500" };
  }
};

const getSectionColor = (isDark: boolean) => {
  if (isDark) {
    return { bg: "bg-yellow-900/40", border: "border-yellow-500/70", text: "text-yellow-100", icon: "text-yellow-300", handle: "bg-yellow-500" };
  }
  // Light mode: Classic roadmap.sh yellow
  return { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-900", icon: "text-yellow-700", handle: "bg-yellow-500" };
};

const getSubtopicColor = (isSelected: boolean, isCompleted: boolean, isDark: boolean) => {
  if (isDark) {
    if (isCompleted) {
      return { bg: "bg-green-900/30", border: "border-green-500/50", text: "text-green-200", icon: "text-green-400", handle: "bg-green-500" };
    }
    if (isSelected) {
      return { bg: "bg-blue-900/40", border: "border-blue-500/70", text: "text-blue-100", icon: "text-blue-300", handle: "bg-blue-500" };
    }
    return { bg: "bg-slate-800/60", border: "border-slate-600/60", text: "text-slate-200", icon: "text-slate-400", handle: "bg-slate-500" };
  } else {
    // Light mode colors
    if (isCompleted) {
      return { bg: "bg-green-100", border: "border-green-400", text: "text-green-900", icon: "text-green-700", handle: "bg-green-500" };
    }
    if (isSelected) {
      return { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900", icon: "text-blue-700", handle: "bg-blue-500" };
    }
    return { bg: "bg-white", border: "border-slate-300", text: "text-slate-900", icon: "text-slate-700", handle: "bg-slate-400" };
  }
};

// Connector dot component for premium feel
const ConnectorDot = ({ position, color }: { position: "top" | "bottom" | "left" | "right"; color: string }) => {
  const positionClasses = {
    top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    left: "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2",
    right: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "absolute w-2 h-2 rounded-full border-2 border-white shadow-sm z-10",
        positionClasses[position]
      )}
      style={{ backgroundColor: color }}
    />
  );
};

// Custom node component with enhanced visuals - roadmap.sh style
const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const { type, title, description, hours, icon: Icon, colors, isDark, isCompleted, nodeId, onToggleCompletion } = data;

  return (
    <div
      className={cn(
        "rounded-lg border-2 transition-all duration-200 relative",
        "shadow-md hover:shadow-lg",
        colors.bg,
        colors.border,
        selected && (isDark ? "ring-2 ring-blue-400 ring-offset-2" : "ring-2 ring-blue-500 ring-offset-2"),
        type !== "label" && "hover:scale-[1.02] cursor-pointer",
        type === "level" && "min-w-[260px] max-w-[300px]",
        type === "section" && "min-w-[220px] max-w-[260px]",
        type === "subtopic" && "min-w-[180px] max-w-[220px]",
        isDark ? "bg-slate-800/90" : "bg-white",
      )}
    >
      {/* Completed badge overlay for subtopics */}
      {type === "subtopic" && isCompleted && (
        <div className="absolute -top-1 -right-1 z-20">
          <CheckCircle2 className="h-5 w-5 text-green-500 bg-white dark:bg-slate-900 rounded-full" />
        </div>
      )}

      {/* Checkbox for subtopics in top-left */}
      {type === "subtopic" && onToggleCompletion && (
        <div
          className="absolute top-2 left-2 z-10 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompletion(nodeId);
          }}
        >
          <div
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
              isCompleted
                ? isDark
                  ? "bg-green-600 border-green-500"
                  : "bg-green-500 border-green-600"
                : isDark
                ? "border-slate-500 bg-slate-700/50"
                : "border-slate-300 bg-white"
            )}
          >
            {isCompleted && (
              <CheckCircle2 className={cn("w-3 h-3", isDark ? "text-white" : "text-white")} />
            )}
          </div>
        </div>
      )}
      
      {/* Menu dots in bottom-right */}
      {type === "subtopic" && (
        <div className="absolute bottom-2 right-2 z-10 opacity-40 hover:opacity-100 transition-opacity">
          <div className={cn("w-6 h-6 rounded flex items-center justify-center", isDark ? "hover:bg-slate-700" : "hover:bg-slate-100")}>
            <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>⋯</span>
          </div>
        </div>
      )}
      
      {/* Target handle at top */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          "w-3! h-3! -top-1.5! border-2! rounded-full!",
          isDark ? "bg-slate-600! border-slate-500!" : "bg-slate-300! border-slate-400!"
        )}
        style={{ zIndex: 20 }}
      />

      <div className={cn(
        "px-4",
        type === "level" ? "py-4" : type === "section" ? "py-3" : "py-2.5"
      )}>
        <div className="flex items-start gap-2.5">
          {Icon && (
            <div className={cn(
              "shrink-0 mt-0.5",
              colors.icon
            )}>
              <Icon className={cn(
                type === "level" ? "h-5 w-5" : type === "section" ? "h-4 w-4" : "h-4 w-4"
              )} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold leading-snug",
              type === "level" ? "text-base" : type === "section" ? "text-sm" : "text-sm",
              colors.text,
              isCompleted && type === "subtopic" && "line-through opacity-70"
            )}>
              {title}
            </h3>
            {description && type !== "subtopic" && (
              <p className={cn(
                "text-xs leading-relaxed mt-1 line-clamp-2",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>
                {description}
              </p>
            )}
            {hours && type !== "subtopic" && (
              <div className={cn(
                "flex items-center gap-1.5 mt-2 text-xs",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>
                <Clock className="h-3 w-3" />
                <span>{hours}h</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source handle at bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "w-3! h-3! -bottom-1.5! border-2! rounded-full!",
          isDark ? "bg-slate-600! border-slate-500!" : "bg-slate-300! border-slate-400!"
        )}
        style={{ zIndex: 20 }}
      />

      {/* Additional handles for level nodes */}
      {type === "level" && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            className="bg-yellow-500! border-2! border-yellow-400! w-3! h-3! rounded-full! -left-1.5!"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="bg-yellow-500! border-2! border-yellow-400! w-3! h-3! rounded-full! -right-1.5!"
          />
        </>
      )}

      {/* Additional handles for section nodes */}
      {type === "section" && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className="bg-yellow-500! border-2! border-yellow-400! w-3! h-3! rounded-full! -left-1.5!"
          />
          <Handle
            type="target"
            position={Position.Right}
              className="bg-yellow-500! border-2! border-yellow-400! w-3! h-3! rounded-full! -right-1.5!"
          />
        </>
      )}
    </div>
  );
};

const edgeTypes = {
  smoothstep: SmoothStepEdge,
  bezier: BezierEdge,
};

export default function GraphView({
  roadmap,
  selectedTopicId,
  onTopicSelect,
  progress,
  onToggleCompletion,
}: GraphViewProps) {
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [currentRoadmap, setCurrentRoadmap] = useState<Roadmap>(roadmap);
  const [explanationPanelOpen, setExplanationPanelOpen] = useState(false);
  const [explainTopicId, setExplainTopicId] = useState<string | null>(null);
  const [explainTopicTitle, setExplainTopicTitle] = useState<string | null>(null);
  const { theme, resolvedTheme } = useTheme();

  // Update roadmap when it changes
  useEffect(() => {
    setCurrentRoadmap(roadmap);
  }, [roadmap]);

  const handleRoadmapUpdate = (updatedRoadmap: Roadmap) => {
    setCurrentRoadmap(updatedRoadmap);
  };

  // Map next-themes theme to React Flow ColorMode
  const colorMode: ColorMode = useMemo(() => {
    if (theme === "system" || !theme) return "system";
    return theme as ColorMode;
  }, [theme]);

  // Determine if dark mode based on resolved theme from next-themes
  const isDark = resolvedTheme === "dark";

  // Handler for opening explanation panel
  const handleExplain = useCallback((topicId: string, topicTitle: string) => {
    setExplainTopicId(topicId);
    setExplainTopicTitle(topicTitle);
    setExplanationPanelOpen(true);
  }, []);

  // Build graph structure first
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeIdSet = new Set<string>();
    const edgeIdSet = new Set<string>();
    const totalLevels = currentRoadmap.structure.levels.length;

    currentRoadmap.structure.levels.forEach((level, levelIndex) => {
      const levelColors = getLevelColor(levelIndex, totalLevels, isDark);
      const LevelIcon = getIcon(level.title, "level");

      // Level node (main category) - removed label banner
      if (!nodeIdSet.has(level.id)) {
        nodes.push({
          id: level.id,
          type: "custom",
          position: { x: 0, y: 0 }, // Will be calculated by dagre
          data: {
            type: "level",
            title: level.title,
            description: level.description,
            hours: level.estimatedHours,
            icon: LevelIcon,
            colors: levelColors,
            isDark,
          },
          width: 280,
          height: 120,
        });
        nodeIdSet.add(level.id);
      }

      // Process sections - connect them sequentially to create a single flow
      level.sections.forEach((section, sectionIndex) => {
        const sectionColors = getSectionColor(isDark);
        const SectionIcon = getIcon(section.title, "section");

        // Section node
        if (!nodeIdSet.has(section.id)) {
          nodes.push({
            id: section.id,
            type: "custom",
            position: { x: 0, y: 0 }, // Will be calculated by dagre
            data: {
              type: "section",
              title: section.title,
              description: section.description,
              hours: section.estimatedHours,
              icon: SectionIcon,
              colors: sectionColors,
              isDark,
            },
            width: 240,
            height: 100,
          });
          nodeIdSet.add(section.id);
        }

        // Edge from level to first section
        if (sectionIndex === 0) {
          const levelSectionEdgeId = `${level.id}-${section.id}`;
          if (!edgeIdSet.has(levelSectionEdgeId)) {
            edges.push({
              id: levelSectionEdgeId,
              source: level.id,
              target: section.id,
              sourceHandle: undefined,
              targetHandle: undefined,
              type: "smoothstep",
              style: { 
                stroke: isDark ? "#fbbf24" : "#eab308",
                strokeWidth: 2.5,
              },
            });
            edgeIdSet.add(levelSectionEdgeId);
          }
        }

        // Connect sections sequentially (each section connects to the next)
        if (sectionIndex < level.sections.length - 1) {
          const nextSection = level.sections[sectionIndex + 1];
          const sectionToSectionEdgeId = `${section.id}-${nextSection.id}`;
          if (!edgeIdSet.has(sectionToSectionEdgeId)) {
            edges.push({
              id: sectionToSectionEdgeId,
              source: section.id,
              target: nextSection.id,
              sourceHandle: undefined,
              targetHandle: undefined,
              type: "smoothstep",
              style: { 
                stroke: isDark ? "#fbbf24" : "#eab308",
                strokeWidth: 2,
                strokeDasharray: "4,4",
              },
            });
            edgeIdSet.add(sectionToSectionEdgeId);
          }
        }

        // Process subtopics - connect them sequentially
        section.subtopics.forEach((subtopic, subtopicIndex) => {
          const isSelected = selectedTopicId === subtopic.id;
          const isCompleted = progress?.get(subtopic.id) || false;
          const subtopicColors = getSubtopicColor(isSelected, isCompleted, isDark);
          const SubtopicIcon = getIcon(subtopic.title, "subtopic");

          // Subtopic node
          if (!nodeIdSet.has(subtopic.id)) {
            nodes.push({
              id: subtopic.id,
              type: "custom",
              position: { x: 0, y: 0 }, // Will be calculated by dagre
              data: {
                type: "subtopic",
                title: subtopic.title,
                description: subtopic.description,
                hours: subtopic.estimatedHours,
                icon: SubtopicIcon,
                colors: subtopicColors,
                isDark,
                isCompleted,
                nodeId: subtopic.id,
                onToggleCompletion,
              },
              width: 190,
              height: 75,
              selected: isSelected,
            });
            nodeIdSet.add(subtopic.id);
          }

          // Edge from section to first subtopic only
          if (subtopicIndex === 0) {
            const sectionSubtopicEdgeId = `${section.id}-${subtopic.id}`;
            if (!edgeIdSet.has(sectionSubtopicEdgeId)) {
              edges.push({
                id: sectionSubtopicEdgeId,
                source: section.id,
                target: subtopic.id,
                sourceHandle: undefined,
                targetHandle: undefined,
                type: "smoothstep",
                style: { 
                  stroke: isDark ? "#64748b" : "#475569",
                  strokeWidth: 2,
                },
              });
              edgeIdSet.add(sectionSubtopicEdgeId);
            }
          }

          // Connect subtopics sequentially (each subtopic connects to the next)
          if (subtopicIndex < section.subtopics.length - 1) {
            const nextSubtopic = section.subtopics[subtopicIndex + 1];
            const subtopicToSubtopicEdgeId = `${subtopic.id}-${nextSubtopic.id}`;
            if (!edgeIdSet.has(subtopicToSubtopicEdgeId)) {
              edges.push({
                id: subtopicToSubtopicEdgeId,
                source: subtopic.id,
                target: nextSubtopic.id,
                sourceHandle: undefined,
                targetHandle: undefined,
                type: "smoothstep",
                style: { 
                  stroke: isDark ? "#64748b" : "#475569",
                  strokeWidth: 1.5,
                  strokeDasharray: "3,3",
                },
              });
              edgeIdSet.add(subtopicToSubtopicEdgeId);
            }
          }
        });
      });

      // Prerequisites edges (only if they don't create cycles)
      level.sections.forEach((section) => {
        section.subtopics.forEach((subtopic) => {
          const prereqs = currentRoadmap.prerequisites?.[subtopic.id]?.requiredTopics || [];
          prereqs.forEach((prereqId) => {
            // Only add prerequisite edge if both nodes exist and it doesn't create a direct cycle
            if (nodeIdSet.has(prereqId) && nodeIdSet.has(subtopic.id) && prereqId !== subtopic.id) {
              const prereqEdgeId = `${prereqId}-prereq-${subtopic.id}`;
              if (!edgeIdSet.has(prereqEdgeId)) {
                edges.push({
                  id: prereqEdgeId,
                  source: prereqId,
                  target: subtopic.id,
                  sourceHandle: undefined,
                  targetHandle: undefined,
                  type: "bezier",
                  style: {
                    stroke: isDark ? "#94a3b8" : "#64748b",
                    strokeWidth: 1.5,
                    strokeDasharray: "5,5",
                  },
                  animated: false,
                });
                edgeIdSet.add(prereqEdgeId);
              }
            }
          });
        });
      });

      // Connect levels sequentially to create a single vertical flow
      if (levelIndex < currentRoadmap.structure.levels.length - 1) {
        const nextLevel = currentRoadmap.structure.levels[levelIndex + 1];
        // Connect the last section of current level to the first section of next level
        const currentLevelLastSection = level.sections[level.sections.length - 1];
        const nextLevelFirstSection = nextLevel.sections[0];
        
        if (currentLevelLastSection && nextLevelFirstSection) {
          const levelToLevelEdgeId = `${currentLevelLastSection.id}-${nextLevelFirstSection.id}`;
          if (!edgeIdSet.has(levelToLevelEdgeId)) {
            edges.push({
              id: levelToLevelEdgeId,
              source: currentLevelLastSection.id,
              target: nextLevelFirstSection.id,
              sourceHandle: undefined,
              targetHandle: undefined,
              type: "smoothstep",
              style: { 
                stroke: isDark ? "#3b82f6" : "#2563eb",
                strokeWidth: 2.5,
                strokeDasharray: "5,5",
              },
            });
            edgeIdSet.add(levelToLevelEdgeId);
          }
        }
      }
    });

    return { nodes, edges };
  }, [currentRoadmap, selectedTopicId, isDark, progress, onToggleCompletion]);

  // Apply dagre layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (initialNodes.length === 0 || initialEdges.length === 0) {
      return { nodes: initialNodes, edges: initialEdges };
    }
    
    // Verify all edge sources and targets exist
    const nodeIds = new Set(initialNodes.map(n => n.id));
    const validEdges = initialEdges.filter(edge => {
      return nodeIds.has(edge.source) && nodeIds.has(edge.target);
    });
    
    return getLayoutedElements(initialNodes, validEdges, "TB");
  }, [initialNodes, initialEdges]);

  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.data?.type === "subtopic") {
        onTopicSelect(selectedTopicId === node.id ? null : String(node.id));
        // Automatically open explanation panel
        handleExplain(String(node.id), node.data.title as string);
      }
    },
    [selectedTopicId, onTopicSelect, handleExplain]
  );

  // Set default zoom to 50% after layout
  useEffect(() => {
    if (reactFlowInstance && layoutedNodes.length > 0) {
      // React Flow automatically updates node internals when nodes change
      // Use a longer delay to ensure dagre layout is fully applied
      setTimeout(() => {
        reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 0.5 }, { duration: 800 });
      }, 500);
    }
  }, [reactFlowInstance, layoutedNodes]);

  return (
    <div className={cn("w-full h-screen fixed inset-0 transition-colors duration-300", isDark ? "bg-slate-900" : "bg-slate-50")}>
      {/* Theme indicator - shows current theme (managed by next-themes) */}
      <div
        className={cn(
          "absolute top-4 right-4 z-20 p-3 rounded-xl shadow-lg transition-all duration-200 border-2",
          isDark 
            ? "bg-slate-800/95 border-slate-700 text-yellow-400" 
            : "bg-white/95 border-slate-200 text-yellow-600"
        )}
        title={`Current theme: ${resolvedTheme || "system"}`}
      >
        {isDark ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </div>

      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onInit={setReactFlowInstance}
        className={cn("transition-colors duration-300", isDark ? "bg-slate-900" : "bg-slate-50")}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        colorMode={colorMode}
        defaultEdgeOptions={{
          style: { 
            strokeWidth: 2.5,
          },
        }}
      >
        <Background
          gap={24}
          size={1}
          color={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className={cn(
            "border-2 rounded-xl shadow-lg",
            isDark 
              ? "bg-slate-800/95 border-slate-700 backdrop-blur-sm" 
              : "bg-white/95 border-slate-200 backdrop-blur-sm"
          )}
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const nodeType = node.data?.type;
            if (nodeType === "level") return isDark ? "#3b82f6" : "#2563eb";
            if (nodeType === "section") return isDark ? "#fbbf24" : "#eab308";
            if (nodeType === "subtopic") return isDark ? "#64748b" : "#475569";
            return isDark ? "#475569" : "#94a3b8";
          }}
          nodeStrokeWidth={3}
          className={cn(
            "border-2 rounded-xl shadow-lg",
            isDark 
              ? "bg-slate-800/95 border-slate-700 backdrop-blur-sm" 
              : "bg-white/95 border-slate-200 backdrop-blur-sm"
          )}
          maskColor={isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"}
          pannable
          zoomable
        />
      </ReactFlow>
      
      {/* AI Assistant - Always visible in center */}
      <RoadmapAssistant
        roadmapId={currentRoadmap.roadmapId}
        onRoadmapUpdate={handleRoadmapUpdate}
        isDark={isDark}
      />

      {/* Topic Explanation Panel */}
      <TopicExplanationPanel
        roadmapId={currentRoadmap.roadmapId}
        topicId={explainTopicId}
        topicTitle={explainTopicTitle}
        isOpen={explanationPanelOpen}
        onClose={() => setExplanationPanelOpen(false)}
      />

      
    </div>
  );
}
