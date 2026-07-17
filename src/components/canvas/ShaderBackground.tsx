"use client";

/**
 * Shader Background — Animated Wireframe Wave Grid + Starfield
 * Replaces the original flat digital-flow shader.
 * 
 * Visual: perspective wireframe grid terrain waving rhythmically like water,
 * scattered star particles, glowing orbs on wave peaks.
 * Color: cyan/teal (#00f0ff) on deep black (#050508).
 */

import { useEffect, useRef } from "react";

const VS = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FS = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

// Pseudo-random for stars
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Wave function — multiple sine frequencies for natural water feel
float wave(vec2 p, float t) {
  float w = 0.0;
  w += sin(p.x * 2.0 + t * 0.8) * 0.35;
  w += sin(p.y * 3.0 + t * 0.6) * 0.25;
  w += sin((p.x + p.y) * 1.5 + t * 1.2) * 0.2;
  w += sin(p.x * 5.0 - t * 1.5) * 0.1;
  w += sin(p.y * 4.0 + t * 0.9) * 0.1;
  return w;
}

// Grid line function
float grid(vec2 p, float lineWidth) {
  vec2 g = abs(fract(p) - 0.5);
  float line = min(g.x, g.y);
  return 1.0 - smoothstep(0.0, lineWidth, line);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  float time = u_time * 0.4;
  
  // Background — deep black with subtle gradient
  vec3 bg = vec3(0.02, 0.02, 0.03);
  
  // --- STARS (upper portion) ---
  vec3 starColor = vec3(0.0);
  vec2 starUv = uv * vec2(aspect, 1.0) * 80.0;
  vec2 starId = floor(starUv);
  float starRand = hash(starId);
  if (starRand > 0.97) {
    vec2 starPos = fract(starUv) - 0.5;
    float starDist = length(starPos);
    float starBright = smoothstep(0.05, 0.0, starDist);
    // Twinkle
    starBright *= 0.5 + 0.5 * sin(time * 2.0 + starRand * 6.28);
    starColor = vec3(0.7, 0.85, 0.9) * starBright;
  }
  
  // --- PERSPECTIVE GRID TERRAIN ---
  // Map UV to a perspective plane — looking across the terrain
  float horizon = 0.45; // horizon line position
  vec3 gridColor = vec3(0.0);
  
  if (uv.y < horizon + 0.05) {
    // Perspective transformation
    float depth = (horizon - uv.y) / horizon; // 0 at horizon, 1 at bottom
    depth = max(depth, 0.001);
    float perspZ = 1.0 / (depth + 0.1); // perspective depth
    
    // Grid coordinates in world space
    float gridX = (uv.x - 0.5) * aspect * perspZ * 4.0;
    float gridZ = perspZ * 6.0 + time * 0.5; // scrolling forward
    
    vec2 gridPos = vec2(gridX, gridZ);
    
    // Apply wave displacement for the brightness (simulates height)
    float w = wave(gridPos * 0.3, time);
    
    // Grid lines — thinner at distance
    float lineWidth = 0.02 + depth * 0.03;
    float gridLines = grid(gridPos * 0.8, lineWidth);
    
    // Fade with distance (atmospheric perspective)
    float distFade = smoothstep(0.0, 0.8, depth);
    
    // Wave brightness — peaks glow more
    float waveBright = 0.3 + 0.7 * (w * 0.5 + 0.5);
    
    // Cyan/teal color
    vec3 lineColor = mix(
      vec3(0.0, 0.58, 0.65), // darker teal
      vec3(0.0, 0.94, 1.0),  // bright cyan #00f0ff
      waveBright
    );
    
    gridColor = lineColor * gridLines * distFade * 0.8;
    
    // Edge glow at wave peaks
    float peakGlow = smoothstep(0.5, 0.8, w) * gridLines * distFade;
    gridColor += vec3(0.0, 0.94, 1.0) * peakGlow * 0.4;
    
    // Horizon glow
    float horizonGlow = smoothstep(0.1, 0.0, abs(uv.y - horizon)) * 0.15;
    gridColor += vec3(0.0, 0.7, 0.8) * horizonGlow;
  }
  
  // --- FLOATING ORBS ---
  vec3 orbColor = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float orbTime = time * (0.3 + fi * 0.1);
    vec2 orbPos = vec2(
      0.15 + 0.7 * hash(vec2(fi, 1.0)) + sin(orbTime + fi) * 0.05,
      0.1 + 0.3 * hash(vec2(fi, 2.0)) + cos(orbTime * 0.7 + fi * 2.0) * 0.03
    );
    float orbDist = length((uv - orbPos) * vec2(aspect, 1.0));
    float orb = smoothstep(0.015, 0.0, orbDist);
    float orbGlow = smoothstep(0.06, 0.0, orbDist) * 0.3;
    // Pulse
    float pulse = 0.7 + 0.3 * sin(time * 1.5 + fi * 1.3);
    orbColor += vec3(0.0, 0.9, 1.0) * (orb + orbGlow) * pulse;
  }
  
  // --- COMPOSE ---
  vec3 color = bg + starColor + gridColor + orbColor;
  
  // Subtle vignette
  float vignette = 1.0 - length((uv - 0.5) * 1.2) * 0.3;
  color *= vignette;
  
  gl_FragColor = vec4(color, 1.0);
}`;

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl") || (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    syncSize();

    function createShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error("[ShaderBackground]", gl!.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    let raf: number;
    function render(t: number) {
      syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
