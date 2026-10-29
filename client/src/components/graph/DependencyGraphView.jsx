import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '../../context/ProjectContext';
import TaskNode from './TaskNode';
import GraphControls from './GraphControls';
import {
  getLayoutedElements,
  willCreateCycle,
  findCycleChain,
} from '../../services/graphUtils';

const nodeTypes = {
  taskNode: TaskNode,
};

export default function DependencyGraphView() {
  const {
    tasks,
    cpm,
    showCriticalPath,
    blastRadiusTaskId,
    setBlastRadiusTaskId,
    selectedTaskId,
    setSelectedTaskId,
    currentRole,
    handleUpdateTask,
    setCycleModalData,
    addNotification,
  } = useProject();

  const [layoutDirection, setLayoutDirection] = useState('LR');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const criticalPathSet = useMemo(
    () => new Set(cpm?.criticalPath || []),
    [cpm?.criticalPath]
  );

  // Compute blast radius set if active
  const blastRootTask = useMemo(
    () => tasks.find((t) => t.taskId === blastRadiusTaskId),
    [tasks, blastRadiusTaskId]
  );

  const blastImpactedSet = useMemo(() => {
    if (!blastRootTask?.blastRadius?.allImpacted) return new Set();
    return new Set(blastRootTask.blastRadius.allImpacted);
  }, [blastRootTask]);

  // Construct raw nodes and edges from tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rawEdges = [];
    tasks.forEach((task) => {
      (task.dependencies || []).forEach((depId) => {
        const isCriticalEdge =
          showCriticalPath &&
          criticalPathSet.has(depId) &&
          criticalPathSet.has(task.taskId);

        const isBlastEdge =
          blastRadiusTaskId &&
          (depId === blastRadiusTaskId || blastImpactedSet.has(depId)) &&
          blastImpactedSet.has(task.taskId);

        rawEdges.push({
          id: `e-${depId}-${task.taskId}`,
          source: depId,
          target: task.taskId,
          animated: isBlastEdge,
          className: isCriticalEdge
            ? 'critical-edge'
            : isBlastEdge
            ? 'blast-edge'
            : '',
          style: {
            stroke: isCriticalEdge
              ? '#F59E0B'
              : isBlastEdge
              ? '#F43F5E'
              : '#3F3F46',
            strokeWidth: isCriticalEdge ? 3 : isBlastEdge ? 2.5 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalEdge
              ? '#F59E0B'
              : isBlastEdge
              ? '#F43F5E'
              : '#52525B',
            width: 14,
            height: 14,
          },
        });
      });
    });

    const rawNodes = tasks.map((task) => {
      const isCritical = criticalPathSet.has(task.taskId);
      const isBlastRoot = task.taskId === blastRadiusTaskId;
      const isBlastImpacted = blastImpactedSet.has(task.taskId);
      const isDimmed =
        blastRadiusTaskId && !isBlastRoot && !isBlastImpacted;

      return {
        id: task.taskId,
        type: 'taskNode',
        data: {
          task,
          isCritical: showCriticalPath && isCritical,
          isBlastRoot,
          isBlastImpacted,
          isDimmed,
          onSelect: (taskId) => {
            setSelectedTaskId(taskId);
          },
        },
        position: { x: 0, y: 0 },
      };
    });

    // Run dagre automated layout
    const layouted = getLayoutedElements(rawNodes, rawEdges, layoutDirection);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [
    tasks,
    layoutDirection,
    showCriticalPath,
    criticalPathSet,
    blastRadiusTaskId,
    blastImpactedSet,
    setSelectedTaskId,
    setNodes,
    setEdges,
  ]);

  // Fit view once initialized
  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }
  }, [reactFlowInstance]);

  const handleToggleLayout = () => {
    setLayoutDirection((prev) => (prev === 'LR' ? 'TB' : 'LR'));
  };

  // Handle Drag & Drop Connection between Tasks
  const onConnect = useCallback(
    async (connection) => {
      if (currentRole === 'Viewer') {
        addNotification('error', 'Viewer role is read-only. Switch to Project Lead to connect dependencies.');
        return;
      }

      const { source, target } = connection;
      if (!source || !target) return;

      // 1. Self dependency check
      if (source === target) {
        addNotification('error', `Self-dependency blocked: Task ${source} cannot depend on itself.`);
        return;
      }

      // 2. Cycle Detection
      if (willCreateCycle(edges, source, target)) {
        const cycleChain = findCycleChain(edges, source, target);
        setCycleModalData({
          isOpen: true,
          cyclePath: cycleChain,
          message: `Adding dependency from ${source} to ${target} creates a closed cycle loop: ${cycleChain.join(' → ')}. DAG invariants forbid circular dependency chains.`,
        });
        return;
      }

      // 3. Commit dependency: target task depends on source task
      const targetTask = tasks.find((t) => t.taskId === target);
      if (!targetTask) return;

      const currentDeps = targetTask.dependencies || [];
      if (currentDeps.includes(source)) {
        addNotification('info', `Dependency from ${source} to ${target} already exists.`);
        return;
      }

      const newDeps = [...currentDeps, source];
      await handleUpdateTask(target, { dependencies: newDeps });
    },
    [
      currentRole,
      edges,
      tasks,
      handleUpdateTask,
      setCycleModalData,
      addNotification,
    ]
  );

  // Handle edge deletion when clicked / selected
  const onEdgeClick = useCallback(
    async (event, edge) => {
      if (currentRole === 'Viewer') return;

      const confirmDelete = window.confirm(
        `Remove prerequisite dependency link: ${edge.source} → ${edge.target}?`
      );
      if (!confirmDelete) return;

      const targetTask = tasks.find((t) => t.taskId === edge.target);
      if (!targetTask) return;

      const updatedDeps = (targetTask.dependencies || []).filter(
        (id) => id !== edge.source
      );
      await handleUpdateTask(edge.target, { dependencies: updatedDeps });
      addNotification('success', `Removed dependency: ${edge.source} from ${edge.target}`);
    },
    [currentRole, tasks, handleUpdateTask, addNotification]
  );

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-canvas overflow-hidden">
      {/* Floating Toolbar Controls */}
      <GraphControls
        layoutDirection={layoutDirection}
        onToggleLayout={handleToggleLayout}
        onFitView={handleFitView}
      />

      {/* Main Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onInit={(instance) => {
          setReactFlowInstance(instance);
          setTimeout(() => instance.fitView({ padding: 0.15 }), 150);
        }}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#27272A" gap={20} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const task = node.data?.task;
            if (task?.status === 'Completed') return '#10B981';
            if (task?.status === 'Ready') return '#14B8A6';
            if (task?.status === 'In Progress') return '#6366F1';
            if (task?.status === 'Blocked') return '#F43F5E';
            return '#71717A';
          }}
          maskColor="rgba(9, 9, 11, 0.85)"
          className="!bg-panel-card !border !border-panel-border !rounded-xl overflow-hidden shadow-2xl hidden md:block"
        />
      </ReactFlow>
    </div>
  );
}
