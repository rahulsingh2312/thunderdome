"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { channels } from "@/lib/models";

/**
 * The arcade: a dark back room, one fluorescent tube, six cabinets in a row,
 * one per agent. The intro replays the reference film: darkness, the tube
 * flickers twice, then the machines power on one by one.
 *
 * Craft constraints:
 * - room palette follows the theme (dark room / house lights on);
 * - DPR capped, loop pauses offscreen and on hidden tabs;
 * - prefers-reduced-motion skips the flicker and every idle motion;
 * - WebGL failure leaves the page usable without the scene.
 */

const SPACING = 2.4;
const CAM_DEFAULT = new THREE.Vector3(0, 2.5, 12.4);
const LOOK_DEFAULT = new THREE.Vector3(0, 2.0, 0);

/** 8x8 two-frame sprite masks, one creature per channel. */
const SPRITES: [string[], string[]][] = [
  [
    ["..1111..", ".111111.", "11.11.11", "11111111", "1.1111.1", "1.1..1.1", "..1..1..", ".1....1."],
    ["..1111..", ".111111.", "11.11.11", "11111111", "1.1111.1", "..1..1..", ".1.11.1.", "1......1"],
  ],
  [
    ["1..11..1", "1.1111.1", "11111111", "111..111", "11111111", ".111111.", "..1..1..", ".1....1."],
    ["1..11..1", "1.1111.1", "11111111", "111..111", "11111111", ".111111.", ".1....1.", "..1..1.."],
  ],
  [
    ["..1..1..", ".111111.", "11.11.11", "11111111", ".111111.", "..1111..", ".1.11.1.", "1..11..1"],
    ["..1..1..", ".111111.", "11.11.11", "11111111", ".111111.", "..1111..", "1..11..1", ".1....1."],
  ],
  [
    [".1....1.", "..1..1..", ".111111.", "11.11.11", "11111111", "11111111", "1.1..1.1", "..1..1.."],
    [".1....1.", "..1..1..", ".111111.", "11.11.11", "11111111", "11111111", ".1.11.1.", "1.1..1.1"],
  ],
  [
    ["...11...", "..1111..", ".111111.", "11.11.11", "11111111", ".1.11.1.", "1..11..1", ".1....1."],
    ["...11...", "..1111..", ".111111.", "11.11.11", "11111111", ".1.11.1.", "..1..1..", ".1.11.1."],
  ],
  [
    ["1.1111.1", "1111111.", ".11..11.", "11111111", ".111111.", "1.1111.1", "1..11..1", "..1..1.."],
    ["1.1111.1", ".1111111", ".11..11.", "11111111", ".111111.", "1.1111.1", "..1..1..", ".1....1."],
  ],
];

export type AgentScreenData = {
  label: string;
  ch: number;
  ret: number;
  equityText: string;
  /** Normalized 0..1 equity history for the on-screen chart. */
  spark: number[];
  /** "Ξ0.0100" once anyone has backed this machine. */
  backedText: string | null;
};

type Props = {
  className?: string;
  screens: AgentScreenData[];
  selected: number | null;
  onSelect: (i: number | null) => void;
};

/** Procedural grime: rust blotches and drip streaks over a dark base. */
function grungeTexture(seed: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a2925";
  g.fillRect(0, 0, 256, 256);
  let r = seed;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const rusts = ["#4a3320", "#5d3d22", "#6e4526", "#3a2c1c"];
  for (let i = 0; i < 70; i++) {
    g.fillStyle = rusts[Math.floor(rnd() * rusts.length)];
    g.globalAlpha = 0.05 + rnd() * 0.12;
    g.beginPath();
    g.ellipse(rnd() * 256, rnd() * 256, 4 + rnd() * 26, 3 + rnd() * 14, rnd() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 22; i++) {
    g.globalAlpha = 0.05 + rnd() * 0.08;
    g.fillStyle = i % 3 ? "#0c1512" : "#5d3d22";
    const x = rnd() * 256;
    g.fillRect(x, rnd() * 100, 1 + rnd() * 2, 60 + rnd() * 140);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function radialGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function ArcadeScene({ className, screens, selected, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const screensRef = useRef(screens);
  screensRef.current = screens;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.copy(CAM_DEFAULT);

    // ── Room, themed ──────────────────────────────────────────────────────
    const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
    const floorMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), wallMat);
    wall.position.set(0, 7, -0.9);
    scene.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Fluorescent tube above the row.
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0xeafff2, transparent: true });
    const tube = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.06, 0.12), tubeMat);
    tube.position.set(0, 5.75, 0.6);
    scene.add(tube);
    const tubeLight = new THREE.PointLight(0xdfffe9, 0, 40, 1.6);
    tubeLight.position.set(0, 5.5, 1.8);
    scene.add(tubeLight);

    const darkRoom = true;
    function applyTheme() {
      wallMat.color.set(0x0f2723);
      floorMat.color.set(0x081210);
      scene.background = new THREE.Color(0x050a09);
      scene.fog = new THREE.Fog(0x050a09, 12, 38);
      ambient.color.set(0x9fd8c4);
    }

    // ── Cabinets ──────────────────────────────────────────────────────────
    type Cab = {
      group: THREE.Group;
      screenCanvas: HTMLCanvasElement;
      screenTex: THREE.CanvasTexture;
      light: THREE.PointLight;
      edgeMats: THREE.MeshBasicMaterial[];
      heatMat: THREE.MeshBasicMaterial;
      color: THREE.Color;
      colorHex: string;
      powerAt: number;
      powered: boolean;
      hovered: boolean;
    };

    const glowTex = radialGlowTexture();
    const bodyMat = new THREE.MeshStandardMaterial({ map: grungeTexture(7), color: 0xb8b0a4, roughness: 0.85 });
    const bodyMat2 = new THREE.MeshStandardMaterial({ map: grungeTexture(31), color: 0x9c948a, roughness: 0.9 });
    const deckMat = new THREE.MeshStandardMaterial({ map: grungeTexture(53), color: 0xaaa298, roughness: 0.75 });
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0c1512, roughness: 0.6 });
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x101a17, roughness: 0.5 });

    const cableMat = new THREE.MeshStandardMaterial({ color: 0x0b100e, roughness: 0.9 });

    const cabs: Cab[] = channels.map((c, i) => {
      const group = new THREE.Group();
      group.position.x = (i - (channels.length - 1) / 2) * SPACING;
      group.userData.cab = i;

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.2, 1.3), i % 2 ? bodyMat2 : bodyMat);
      body.position.y = 1.6;
      group.add(body);

      const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.66, 1.3, 0.06), bezelMat);
      bezel.position.set(0, 1.95, 0.66);
      group.add(bezel);

      const screenCanvas = document.createElement("canvas");
      screenCanvas.width = 256;
      screenCanvas.height = 192;
      const screenTex = new THREE.CanvasTexture(screenCanvas);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.44, 1.08),
        new THREE.MeshBasicMaterial({ map: screenTex }),
      );
      screen.position.set(0, 1.95, 0.7);
      group.add(screen);

      // Marquee with the agent's name.
      const mCanvas = document.createElement("canvas");
      mCanvas.width = 256;
      mCanvas.height = 56;
      const mCtx = mCanvas.getContext("2d")!;
      const chHex = () => cssVar(`--ch-${c.ch}`) || "#35e0ff";
      const drawMarquee = (lit: boolean) => {
        mCtx.fillStyle = "#050a08";
        mCtx.fillRect(0, 0, 256, 56);
        mCtx.font = "700 26px 'Chakra Petch', sans-serif";
        mCtx.textAlign = "center";
        mCtx.textBaseline = "middle";
        mCtx.shadowColor = lit ? chHex() : "transparent";
        mCtx.shadowBlur = lit ? 16 : 0;
        mCtx.fillStyle = lit ? chHex() : "#22302b";
        mCtx.fillText(c.label, 128, 30);
      };
      drawMarquee(false);
      const mTex = new THREE.CanvasTexture(mCanvas);
      mTex.colorSpace = THREE.SRGBColorSpace;
      const marqueeBox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.52, 1.15), i % 2 ? bodyMat2 : bodyMat);
      marqueeBox.position.set(0, 3.36, 0);
      group.add(marqueeBox);
      const marquee = new THREE.Mesh(
        new THREE.PlaneGeometry(1.74, 0.4),
        new THREE.MeshBasicMaterial({ map: mTex }),
      );
      marquee.position.set(0, 3.36, 0.59);
      group.add(marquee);
      group.userData.drawMarquee = drawMarquee;
      group.userData.mTex = mTex;

      // Control deck, joystick, buttons.
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.26, 0.8), deckMat);
      deck.position.set(0, 1.18, 0.82);
      deck.rotation.x = -0.28;
      group.add(deck);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), stickMat);
      stick.position.set(-0.5, 1.42, 0.86);
      stick.rotation.x = -0.28;
      group.add(stick);
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0xd6402b, roughness: 0.35 }),
      );
      ball.position.set(-0.5, 1.58, 0.9);
      group.add(ball);
      for (let b = 0; b < 3; b++) {
        const btn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(chHex()) }),
        );
        btn.position.set(0.12 + b * 0.28, 1.28 + b * 0.045, 0.92 - b * 0.06);
        btn.rotation.x = -0.28;
        group.add(btn);
      }

      // Neon edge tubes down the front corners; they flicker like tired signs.
      const edgeMats: THREE.MeshBasicMaterial[] = [];
      for (const ex of [-0.94, 0.94]) {
        const eMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(chHex()),
          transparent: true,
          opacity: 0,
        });
        edgeMats.push(eMat);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.95, 0.045), eMat);
        edge.position.set(ex, 1.62, 0.665);
        group.add(edge);
      }

      // Vent slats near the floor.
      for (let v = 0; v < 4; v++) {
        const slat = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.045, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x060b09, roughness: 1 }),
        );
        slat.position.set(0, 0.34 + v * 0.11, 0.66);
        group.add(slat);
      }

      // Heat pooling on the floor in front of the machine.
      const heatMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        color: new THREE.Color(chHex()),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const heat = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.9), heatMat);
      heat.rotation.x = -Math.PI / 2;
      heat.position.set(0, 0.02, 1.35);
      group.add(heat);

      // A power cable dropping from the dark above into the marquee.
      const drop = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0.3, 7.2, -0.7),
            new THREE.Vector3(0.55, 4.6, -0.35),
            new THREE.Vector3(0, 3.62, 0),
          ),
          20,
          0.022,
          6,
        ),
        cableMat,
      );
      group.add(drop);

      const light = new THREE.PointLight(new THREE.Color(chHex()), 0, 5.5, 1.8);
      light.position.set(0, 2.0, 1.3);
      group.add(light);

      scene.add(group);
      return {
        group,
        screenCanvas,
        screenTex,
        light,
        edgeMats,
        heatMat,
        color: new THREE.Color(chHex()),
        colorHex: chHex(),
        powerAt: reduced ? 0 : 2.0 + i * 0.32,
        powered: reduced,
        hovered: false,
      };
    });

    // Cables snaking on the floor.
    for (let k = 0; k < 4; k++) {
      const x0 = (k - 1.5) * 3.1;
      const pts = [
        new THREE.Vector3(x0, 0.03, 0.7),
        new THREE.Vector3(x0 + 1.1, 0.03, 2.1 + k * 0.5),
        new THREE.Vector3(x0 - 0.8, 0.03, 3.6 + k * 0.7),
        new THREE.Vector3(x0 + 0.4, 0.03, 5.6 + k * 0.5),
      ];
      const tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.035, 6);
      scene.add(new THREE.Mesh(tubeGeo, cableMat));
    }

    applyTheme();

    // ── Screen painting ───────────────────────────────────────────────────
    function paintScreen(cab: Cab, i: number, t: number) {
      const g = cab.screenCanvas.getContext("2d")!;
      const data = screensRef.current[i];
      const w = 256;
      const h = 192;

      if (!cab.powered) {
        g.fillStyle = "#040705";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(255,255,255,0.03)";
        g.fillRect(0, 20, w, 3);
        cab.screenTex.needsUpdate = true;
        return;
      }

      const sincePower = t - cab.powerAt;
      if (!reduced && sincePower < 0.14) {
        g.fillStyle = "#eafff0";
        g.fillRect(0, 0, w, h);
        cab.screenTex.needsUpdate = true;
        return;
      }

      const isSel = selectedRef.current === i;
      const hot = cab.hovered || isSel;
      g.fillStyle = hot ? "#07200f" : "#04140b";
      g.fillRect(0, 0, w, h);

      // Sprite creature: patrols, bobs, and occasionally glitches sideways.
      const frame = reduced ? 0 : Math.floor(t * 2 + i) % 2;
      const mask = SPRITES[i % SPRITES.length][frame];
      const cell = 9;
      const sw = cell * 8;
      const patrol = reduced ? 0 : Math.sin(t * 0.45 + i * 2.2) * 46;
      const ox = (w - sw) / 2 + patrol;
      const oy = 14 + (reduced ? 0 : Math.sin(t * 1.6 + i) * 3);
      const glitch = !reduced && Math.sin(t * 1.1 + i * 3.7) > 0.996;
      g.shadowColor = cab.colorHex;
      g.shadowBlur = hot ? 18 : 10;
      g.fillStyle = cab.colorHex;
      for (let r = 0; r < 8; r++) {
        const gx = glitch && r % 3 === 0 ? (r % 2 ? 6 : -6) : 0;
        for (let cc = 0; cc < 8; cc++) {
          if (mask[r][cc] === "1") g.fillRect(ox + gx + cc * cell, oy + r * cell, cell - 1, cell - 1);
        }
      }
      g.shadowBlur = 0;

      // Live equity chart: real history, drawn only once it says something.
      if (data && data.spark.length >= 2) {
        g.strokeStyle = cab.colorHex;
        g.lineWidth = 2;
        g.globalAlpha = 0.9;
        g.beginPath();
        const gx0 = 26;
        const gw = w - 52;
        const gy0 = 132;
        const gh = 24;
        data.spark.forEach((v, k) => {
          const x = gx0 + (k / (data.spark.length - 1)) * gw;
          const y = gy0 + gh - v * gh;
          if (k === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        });
        g.stroke();
        g.globalAlpha = 1;
      }

      // Live numbers: the honest ornament.
      if (data) {
        const pct = `${data.ret > 0 ? "+" : ""}${(data.ret * 100).toFixed(2)}%`;
        g.font = "700 22px 'IBM Plex Mono', monospace";
        g.textAlign = "center";
        g.fillStyle = data.ret > 0 ? "#3dff8c" : data.ret < 0 ? "#ff5c5c" : "#9db4cc";
        g.fillText(pct, w / 2, 122);
        g.font = "500 12px 'IBM Plex Mono', monospace";
        g.fillStyle = "#7d9b8d";
        g.fillText(data.equityText, w / 2, 172);
        if (data.backedText) {
          g.font = "700 13px 'IBM Plex Mono', monospace";
          g.fillStyle = "#ffd23d";
          g.fillText(`${data.backedText} BACKED`, w / 2, 188);
        }
      }

      // Scanlines.
      g.fillStyle = "rgba(0,0,0,0.28)";
      for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);

      cab.screenTex.needsUpdate = true;
    }

    // ── Intro timeline: dark, two flickers, machines wake in order ────────
    function tubeIntensity(t: number): number {
      if (reduced) return 1;
      if (t < 0.85) return 0;
      if (t < 0.92) return 0.9;
      if (t < 1.12) return 0.05;
      if (t < 1.24) return 1;
      if (t < 1.42) return 0.1;
      if (t < 1.9) return 0.25 + ((t - 1.42) / 0.48) * 0.75;
      return 1;
    }

    // ── Interaction ───────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(2, 2);
    let hoverIdx: number | null = null;

    function pick(): number | null {
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(cabs.map((c) => c.group), true);
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if (o.userData.cab !== undefined) return o.userData.cab as number;
          o = o.parent;
        }
      }
      return null;
    }

    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      );
    };
    const onClick = () => {
      const hit = pick();
      if (hit != null) onSelectRef.current(hit);
      else if (selectedRef.current != null) onSelectRef.current(null);
    };
    renderer.domElement.addEventListener("pointermove", onMove, { passive: true });
    renderer.domElement.addEventListener("click", onClick);

    // ── Camera targets ────────────────────────────────────────────────────
    const camTarget = CAM_DEFAULT.clone();
    const lookTarget = LOOK_DEFAULT.clone();
    const lookNow = LOOK_DEFAULT.clone();

    function retarget() {
      const sel = selectedRef.current;
      if (sel != null) {
        const x = cabs[sel].group.position.x;
        camTarget.set(x, 2.05, 3.4);
        lookTarget.set(x, 1.95, 0);
      } else {
        camTarget.copy(CAM_DEFAULT);
        lookTarget.copy(LOOK_DEFAULT);
      }
    }

    // ── Loop ──────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let elapsed = 0;
    let raf = 0;
    let running = false;
    let onscreen = true;
    let lastPaint = 0;

    function frame(dt: number) {
      elapsed += dt;
      const t = elapsed;

      const flick = tubeIntensity(t);
      tubeLight.intensity = flick * 55;
      tubeMat.opacity = 0.15 + flick * 0.85;
      ambient.intensity = 0.06 + flick * 0.22;

      const hit = onscreen ? pick() : null;
      if (hit !== hoverIdx) {
        hoverIdx = hit;
        renderer.domElement.style.cursor = hit != null ? "pointer" : "default";
        cabs.forEach((c, i) => (c.hovered = i === hit));
      }

      cabs.forEach((cab, i) => {
        if (!cab.powered && t >= cab.powerAt) {
          cab.powered = true;
          (cab.group.userData.drawMarquee as (lit: boolean) => void)(true);
          (cab.group.userData.mTex as THREE.CanvasTexture).needsUpdate = true;
        }
        const sel = selectedRef.current === i;
        const target = cab.powered ? (cab.hovered || sel ? 6.5 : 3.2) : 0;
        cab.light.intensity += (target - cab.light.intensity) * Math.min(1, dt * 8);

        // Tired-neon flicker, deterministic so reduced motion stays still.
        const on = cab.powered ? 1 : 0;
        const flickN = reduced
          ? 1
          : Math.sin(t * 17 + i * 5.1) * Math.sin(t * 3.7 + i * 1.3) > 0.982
            ? 0.25
            : 1;
        const hotness = cab.hovered || sel ? 1 : 0.62;
        for (const m of cab.edgeMats) m.opacity = 0.9 * on * flickN * hotness;
        cab.heatMat.opacity = 0.16 * on * flickN * (cab.hovered || sel ? 1.6 : 1);
      });

      // Screens repaint at ~12fps; hover and selection changes ride along.
      if (t - lastPaint > 0.08) {
        lastPaint = t;
        cabs.forEach((cab, i) => paintScreen(cab, i, t));
      }

      retarget();
      const a = reduced ? 1 : 1 - Math.exp(-5.5 * dt);
      const sway = reduced || selectedRef.current != null ? 0 : Math.sin(t * 0.35) * 0.4;
      camera.position.lerp(new THREE.Vector3(camTarget.x + sway, camTarget.y, camTarget.z), a);
      lookNow.lerp(lookTarget, a);
      camera.lookAt(lookNow);

      renderer.render(scene, camera);
    }

    function loop() {
      frame(Math.min(clock.getDelta(), 0.1));
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

    function resize() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      CAM_DEFAULT.z = camera.aspect < 0.9 ? 17 : 12.4;
      camera.fov = camera.aspect < 0.9 ? 52 : 45;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    setRunning(true);

    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      setRunning(onscreen && !document.hidden);
    });
    io.observe(host);
    const onVis = () => setRunning(onscreen && !document.hidden);
    document.addEventListener("visibilitychange", onVis);


    return () => {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      host.removeChild(renderer.domElement);
    };
    // Scene mounts once; live data flows in through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className={className} role="img" aria-label="Six arcade machines, one per trading agent. Click one to inspect its agent." />;
}
