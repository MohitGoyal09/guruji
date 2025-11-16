import dagre from "@dagrejs/dagre";
import { Node, Edge } from "@xyflow/react";

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 180, // Horizontal spacing between nodes
    ranksep: 250, // Vertical spacing between ranks
    edgesep: 50,
    ranker: "network-simplex", // Better for single connected tree
    align: "UL", // Align nodes to upper-left
    acyclicer: "greedy", // Ensure acyclic graph
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.width || 240,
      height: node.height || 100,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.width || 240) / 2,
        y: nodeWithPosition.y - (node.height || 100) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

