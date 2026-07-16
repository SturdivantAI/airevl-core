"use client";

/**
 * T1.13 — Three.js AI Core (ANIMATION_3)
 * Dual icosahedron — outer wireframe cyan, inner solid violet.
 * Loaded via next/dynamic ssr:false.
 * Source: .kiro/DESIGN.md §6 Animation System
 */

import { useEffect, useRef } from "react";

export default function AICore3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let THREE: typeof import("three");
    let renderer: import("three").WebGLRenderer;
    let raf: number;

    (async () => {
      THREE = await import("three");

      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
      camera.position.z = 6;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Outer wireframe — Primary Cyan
      const outerGeo = new THREE.IcosahedronGeometry(2, 0);
      const outerMat = new THREE.MeshPhongMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
      const outer = new THREE.Mesh(outerGeo, outerMat);
      scene.add(outer);

      // Inner solid — Electric Violet
      const innerGeo = new THREE.IcosahedronGeometry(1.2, 1);
      const innerMat = new THREE.MeshPhongMaterial({
        color: 0x7000ff,
        emissive: new THREE.Color(0x200040),
      });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      scene.add(inner);

      // Lighting
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(10, 10, 10);
      scene.add(pointLight);
      scene.add(new THREE.AmbientLight(0x404040));

      function animate() {
        raf = requestAnimationFrame(animate);
        outer.rotation.x += 0.005;
        outer.rotation.y += 0.005;
        inner.rotation.x -= 0.01;
        inner.rotation.y -= 0.01;
        renderer.render(scene, camera);
      }
      animate();

      const onResize = () => {
        const nw = container.clientWidth || window.innerWidth;
        const nh = container.clientHeight || window.innerHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(raf);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      cancelAnimationFrame(raf!);
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px]"
      aria-hidden="true"
    />
  );
}
