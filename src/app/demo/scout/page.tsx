"use client";

/**
 * Demo 2 — AiRevl Ecosystem Scout (MCP Search)
 * Route: /demo/scout
 * Search bar → multi-node relational graph rendered via Three.js
 * MS-06 from EARS spec
 */

import { useState, useEffect, useRef } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlowButton } from "@/components/ui/GlowButton";
import graphData from "../../../../mock-data/ecosystem-graph.json";

interface GraphNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  z: number;
}

interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

const TYPE_COLORS: Record<string, number> = {
  company: 0x00f0ff,
  founder: 0xd0bcff,
  asset: 0x7df4ff,
  technology: 0x00dbe9,
  platform: 0x571bc1,
  regulation: 0xffb4ab,
};

export default function EcosystemScout() {
  const [query, setQuery] = useState("");
  const [filteredNodes, setFilteredNodes] = useState<GraphNode[]>(graphData.nodes);
  const [filteredEdges, setFilteredEdges] = useState<GraphEdge[]>(graphData.edges);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      setFilteredNodes(graphData.nodes);
      setFilteredEdges(graphData.edges);
      setSelectedNode(null);
      return;
    }

    const q = query.toLowerCase();
    const matched = graphData.nodes.filter(
      (n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    );
    const matchedIds = new Set(matched.map((n) => n.id));

    // Include connected nodes
    const connectedEdges = graphData.edges.filter(
      (e) => matchedIds.has(e.source) || matchedIds.has(e.target)
    );
    const connectedIds = new Set<string>();
    connectedEdges.forEach((e) => { connectedIds.add(e.source); connectedIds.add(e.target); });

    const expandedNodes = graphData.nodes.filter((n) => connectedIds.has(n.id));
    setFilteredNodes(expandedNodes);
    setFilteredEdges(connectedEdges);
    setSelectedNode(matched[0] || null);
  }

  // Render 3D graph
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    let raf: number;
    let renderer: import("three").WebGLRenderer;

    (async () => {
      const THREE = await import("three");

      // Clear previous
      while (container.firstChild) container.removeChild(container.firstChild);

      const w = container.clientWidth || 600;
      const h = container.clientHeight || 400;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
      camera.position.z = 12;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Nodes as spheres
      const nodeMeshes: Map<string, import("three").Mesh> = new Map();
      filteredNodes.forEach((node) => {
        const geo = new THREE.SphereGeometry(node.id === "airevl" ? 0.5 : 0.3, 16, 16);
        const mat = new THREE.MeshPhongMaterial({
          color: TYPE_COLORS[node.type] ?? 0xffffff,
          emissive: new THREE.Color(TYPE_COLORS[node.type] ?? 0xffffff).multiplyScalar(0.3),
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(node.x, node.y, node.z);
        scene.add(mesh);
        nodeMeshes.set(node.id, mesh);
      });

      // Edges as lines
      filteredEdges.forEach((edge) => {
        const srcMesh = nodeMeshes.get(edge.source);
        const tgtMesh = nodeMeshes.get(edge.target);
        if (!srcMesh || !tgtMesh) return;

        const points = [srcMesh.position.clone(), tgtMesh.position.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x00f0ff, opacity: 0.3, transparent: true });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
      });

      // Labels (using sprites would be ideal but keeping simple for now)

      // Lighting
      scene.add(new THREE.AmbientLight(0x404040, 2));
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(5, 5, 10);
      scene.add(pointLight);

      let angle = 0;
      function animate() {
        raf = requestAnimationFrame(animate);
        angle += 0.003;
        camera.position.x = Math.sin(angle) * 12;
        camera.position.z = Math.cos(angle) * 12;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }
      animate();
    })();

    return () => {
      cancelAnimationFrame(raf!);
      renderer?.dispose();
    };
  }, [filteredNodes, filteredEdges]);

  return (
    <div className="p-4 md:p-container-padding h-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          AiRevl Ecosystem Scout
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Search the AiRevl ecosystem graph — founders, assets, technologies, regulations.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes... (e.g. 'technology', 'Supabase', 'regulation')"
          className="flex-1 bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 font-data-mono text-data-mono text-on-surface focus:outline-none focus:border-primary-container/50 placeholder:text-on-surface-variant/40"
        />
        <GlowButton type="submit" variant="primary">Search</GlowButton>
        <GlowButton type="button" variant="secondary" onClick={() => { setQuery(""); setFilteredNodes(graphData.nodes); setFilteredEdges(graphData.edges); setSelectedNode(null); }}>
          Reset
        </GlowButton>
      </form>

      {/* Graph + info */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-gutter min-h-0">
        {/* 3D Graph */}
        <GlassPanel className="lg:col-span-3 overflow-hidden relative">
          <div ref={canvasRef} className="w-full h-full min-h-[400px]" />
          <div className="absolute bottom-4 left-4 font-data-mono text-[11px] text-on-surface-variant/50">
            {filteredNodes.length} nodes · {filteredEdges.length} edges
          </div>
        </GlassPanel>

        {/* Info panel */}
        <GlassPanel className="p-6 overflow-y-auto">
          <h3 className="font-label-caps text-label-caps text-primary-container mb-4 border-b border-white/5 pb-2">
            {selectedNode ? "Selected Node" : "Graph Legend"}
          </h3>

          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <span className="font-data-mono text-[11px] text-on-surface-variant">Label</span>
                <p className="font-headline-lg-mobile text-[18px] text-on-surface">{selectedNode.label}</p>
              </div>
              <div>
                <span className="font-data-mono text-[11px] text-on-surface-variant">Type</span>
                <p className="text-primary-container capitalize">{selectedNode.type}</p>
              </div>
              <div>
                <span className="font-data-mono text-[11px] text-on-surface-variant">Connections</span>
                <ul className="mt-1 space-y-1">
                  {filteredEdges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e, i) => (
                      <li key={i} className="font-data-mono text-[12px] text-on-surface-variant">
                        {e.relation} → {e.source === selectedNode.id ? e.target : e.source}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `#${color.toString(16).padStart(6, "0")}` }} />
                  <span className="font-data-mono text-[12px] text-on-surface-variant capitalize">{type}</span>
                </div>
              ))}
            </div>
          )}

          {/* Node list */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Visible Nodes</h4>
            <div className="space-y-1">
              {filteredNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`block w-full text-left px-2 py-1 rounded text-[12px] font-data-mono transition-colors ${
                    selectedNode?.id === n.id ? "bg-primary-container/10 text-primary-container" : "text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
