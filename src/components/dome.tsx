"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { channels } from "@/lib/models";

/**
 * The Holo-Colosseum: a wireframe geodesic dome on an infinite grid floor,
 * six orbs in channel colours orbiting inside, leaving light trails.
 *
 * Craft constraints, from DESIGN.md:
 * - colours come from CSS tokens and re-read on theme change;
 * - DPR capped at 1.5, loop pauses when offscreen or the tab is hidden;
 * - prefers-reduced-motion renders one static frame;
 * - WebGL failure leaves the page working with no scene.
 */

const DOME_R = 10;
const TRAIL_N = 110;

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#35e0ff";
}

function makeGlowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Dome wireframe, keeping only the segments above the floor. */
function domeEdges(): THREE.BufferGeometry {
  const edges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(DOME_R, 2));
  const pos = edges.getAttribute("position");
  const kept: number[] = [];
  for (let i = 0; i < pos.count; i += 2) {
    const y1 = pos.getY(i);
    const y2 = pos.getY(i + 1);
    if (y1 > -0.05 && y2 > -0.05) {
      kept.push(
        pos.getX(i), y1, pos.getZ(i),
        pos.getX(i + 1), y2, pos.getZ(i + 1),
      );
    }
  }
  edges.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(kept, 3));
  return g;
}

export default function DomeScene({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // No WebGL: the hero stands on its CSS grid alone.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glowTex = makeGlowTexture();

    // ── Materials that must follow the theme ──────────────────────────────
    const domeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.62 });
    const ringMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
    const dustMat = new THREE.PointsMaterial({
      size: 0.07,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    let grid: THREE.GridHelper | null = null;

    const orbMats: THREE.MeshBasicMaterial[] = [];
    const spriteMats: THREE.SpriteMaterial[] = [];
    const trailMats: THREE.LineBasicMaterial[] = [];

    function applyTheme() {
      const holo = new THREE.Color(cssColor("--holo"));
      const ground = new THREE.Color(cssColor("--ground"));
      const dark = cssColor("--glow") === "1";
      for (const m of spriteMats) {
        m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        m.opacity = dark ? 0.9 : 0.4;
        m.needsUpdate = true;
      }
      for (const m of trailMats) {
        m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        m.opacity = dark ? 0.5 : 0.7;
        m.needsUpdate = true;
      }
      dustMat.opacity = dark ? 0.5 : 0.3;
      domeMat.color = holo;
      ringMat.color = holo;
      dustMat.color = holo;
      scene.fog = new THREE.Fog(ground, 20, 70);
      if (grid) {
        scene.remove(grid);
        grid.dispose();
      }
      grid = new THREE.GridHelper(240, 96, holo, holo);
      (grid.material as THREE.Material & { opacity: number; transparent: boolean }).opacity = 0.3;
      (grid.material as THREE.Material).transparent = true;
      scene.add(grid);
      channels.forEach((c, i) => {
        const col = new THREE.Color(cssColor(`--ch-${c.ch}`));
        orbMats[i]?.color.set(col);
        spriteMats[i]?.color.set(col);
        trailMats[i]?.color.set(col);
      });
    }

    // ── Static geometry ───────────────────────────────────────────────────
    scene.add(new THREE.LineSegments(domeEdges(), domeMat));

    const ringPts = new THREE.EllipseCurve(0, 0, DOME_R, DOME_R).getPoints(90);
    const ringGeo = new THREE.BufferGeometry().setFromPoints(
      ringPts.map((p) => new THREE.Vector3(p.x, 0.02, p.y)),
    );
    scene.add(new THREE.LineLoop(ringGeo, ringMat));

    // Dust: slow-rising motes inside the dome.
    const DUST_N = 260;
    const dustPos = new Float32Array(DUST_N * 3);
    for (let i = 0; i < DUST_N; i++) {
      const r = Math.sqrt(Math.random()) * (DOME_R - 1);
      const a = Math.random() * Math.PI * 2;
      dustPos[i * 3] = Math.cos(a) * r;
      dustPos[i * 3 + 1] = Math.random() * (DOME_R - 2);
      dustPos[i * 3 + 2] = Math.sin(a) * r;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    scene.add(new THREE.Points(dustGeo, dustMat));

    // ── The six orbs, their glows, and their trails ───────────────────────
    type Orb = {
      mesh: THREE.Mesh;
      sprite: THREE.Sprite;
      trail: THREE.Line;
      trailPos: Float32Array;
      radius: number;
      height: number;
      speed: number;
      phase: number;
      dir: 1 | -1;
    };
    const orbGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const orbs: Orb[] = channels.map((c, i) => {
      const mat = new THREE.MeshBasicMaterial();
      orbMats.push(mat);
      const mesh = new THREE.Mesh(orbGeo, mat);

      const sMat = new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
      });
      spriteMats.push(sMat);
      const sprite = new THREE.Sprite(sMat);
      sprite.scale.setScalar(2.4);

      const trailPos = new Float32Array(TRAIL_N * 3);
      const tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      const tMat = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      trailMats.push(tMat);
      const trail = new THREE.Line(tGeo, tMat);

      scene.add(mesh, sprite, trail);
      return {
        mesh,
        sprite,
        trail,
        trailPos,
        radius: 3.4 + (i % 3) * 1.65,
        height: 2.1 + ((i * 7) % 4) * 0.85,
        speed: 0.22 + (i % 4) * 0.07,
        phase: (i / channels.length) * Math.PI * 2,
        dir: i % 2 === 0 ? 1 : -1,
      };
    });

    applyTheme();

    // ── Camera drift and pointer parallax ─────────────────────────────────
    let pointerX = 0;
    let pointerTarget = 0;
    const onPointer = (e: PointerEvent) => {
      pointerTarget = (e.clientX / window.innerWidth - 0.5) * 0.5;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    function place(o: Orb, t: number) {
      const a = o.phase + t * o.speed * o.dir;
      const x = Math.cos(a) * o.radius;
      const z = Math.sin(a) * o.radius;
      const y = o.height + Math.sin(a * 2 + o.phase) * 0.7;
      o.mesh.position.set(x, y, z);
      o.sprite.position.set(x, y, z);
    }

    function frame(t: number) {
      for (const o of orbs) {
        place(o, t);
        // Trail: shift history back one slot, write the new head.
        o.trailPos.copyWithin(3, 0, (TRAIL_N - 1) * 3);
        o.trailPos[0] = o.mesh.position.x;
        o.trailPos[1] = o.mesh.position.y;
        o.trailPos[2] = o.mesh.position.z;
        (o.trail.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
      }
      pointerX += (pointerTarget - pointerX) * 0.04;
      const camA = t * 0.05 + pointerX;
      camera.position.set(Math.sin(camA) * 17.5, 5.4, Math.cos(camA) * 17.5);
      camera.lookAt(0, 2.8, 0);
      renderer.render(scene, camera);
    }

    // Seed every trail at its orb so the first frames draw no zero-origin spikes.
    for (const o of orbs) {
      place(o, 0);
      for (let i = 0; i < TRAIL_N; i++) {
        o.trailPos[i * 3] = o.mesh.position.x;
        o.trailPos[i * 3 + 1] = o.mesh.position.y;
        o.trailPos[i * 3 + 2] = o.mesh.position.z;
      }
    }

    function resize() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (reduced) frame(0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // ── Loop, gated on visibility ─────────────────────────────────────────
    let raf = 0;
    let running = false;
    let onscreen = true;
    const clock = new THREE.Clock();
    let elapsed = 0;

    function loop() {
      elapsed += clock.getDelta();
      frame(elapsed);
      raf = requestAnimationFrame(loop);
    }
    function setRunning(next: boolean) {
      if (next === running) return;
      running = next;
      if (running) {
        clock.getDelta();
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    }

    if (reduced) {
      frame(0);
    } else {
      setRunning(true);
    }

    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      if (!reduced) setRunning(onscreen && !document.hidden);
    });
    io.observe(host);
    const onVis = () => {
      if (!reduced) setRunning(onscreen && !document.hidden);
    };
    document.addEventListener("visibilitychange", onVis);

    // Theme swaps re-read every colour.
    const mo = new MutationObserver(() => {
      applyTheme();
      if (reduced) frame(elapsed);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      applyTheme();
      if (reduced) frame(elapsed);
    };
    mq.addEventListener("change", onScheme);

    return () => {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", onScheme);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointer);
      renderer.dispose();
      glowTex.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry.dispose();
        }
      });
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
