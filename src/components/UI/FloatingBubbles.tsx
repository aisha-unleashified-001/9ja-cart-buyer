import React from "react";

interface BubbleConfig {
  size: number;
  top: string;
  side: "left" | "right";
  /** Fraction (0-1) of the actual available margin width, so bubbles spread
   * across the whole empty margin instead of clustering near the viewport edge. */
  ratio: number;
  animation: "animate-float" | "animate-float-slow";
  delay: string;
}

// Pools of small variations that get cycled through per bubble, so the
// margins fill up with a dense, naturally-varied cluster of tiny bubbles.
const TOP_POSITIONS = [
  "3%", "7%", "11%", "15%", "19%", "23%", "27%", "31%", "35%", "39%",
  "43%", "47%", "51%", "55%", "59%", "63%", "67%", "71%", "75%", "79%",
  "83%", "87%", "91%", "95%",
];
const SIZES = [8, 14, 10, 20, 7, 16, 24, 11, 9, 18, 13, 22];
// Spread from near the viewport edge (low ratio) to near the content edge
// (high ratio) so the whole margin gets filled, not just a thin band by the edge.
const RATIOS = [0.06, 0.2, 0.34, 0.48, 0.62, 0.76, 0.9, 0.14, 0.42, 0.7];
const ANIMATIONS: BubbleConfig["animation"][] = ["animate-float", "animate-float-slow"];
const DELAYS = ["0s", "0.4s", "0.8s", "1.2s", "1.6s", "2s", "2.4s", "2.8s"];

function buildSide(side: "left" | "right", phase: number): BubbleConfig[] {
  return TOP_POSITIONS.map((top, i) => ({
    size: SIZES[(i + phase) % SIZES.length],
    top,
    side,
    ratio: RATIOS[(i + phase) % RATIOS.length],
    animation: ANIMATIONS[(i + phase) % ANIMATIONS.length],
    delay: DELAYS[(i + phase) % DELAYS.length],
  }));
}

const BUBBLES: BubbleConfig[] = [...buildSide("left", 0), ...buildSide("right", 4)];

/** A single clear, glassy water-bubble sphere (not a flat color blob). */
const Bubble: React.FC<{ config: BubbleConfig }> = ({ config }) => {
  const { size, top, side, ratio, animation, delay } = config;

  return (
    <span
      className={`absolute rounded-full ${animation}`}
      style={{
        top,
        // Positioned as a fraction of the real margin width (--bubble-margin,
        // set on the wrapper below), so bubbles spread across the entire
        // empty margin instead of leaving a gap next to the content edge.
        [side]: `calc(var(--bubble-margin) * ${ratio})`,
        width: size,
        height: size,
        animationDelay: delay,
        background:
          "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 8%, rgba(210,240,255,0.15) 28%, rgba(160,215,235,0.05) 50%, rgba(120,190,220,0.2) 100%)",
        boxShadow:
          "inset 0 0 3px rgba(255,255,255,0.9), inset -2px -2px 5px rgba(80,160,190,0.25), inset 1px 2px 3px rgba(255,255,255,0.6), 0 1px 3px rgba(80,160,190,0.15)",
        border: "1px solid rgba(255,255,255,0.65)",
      }}
    >
      {/* Glossy highlight, like light reflecting off a water droplet */}
      <span
        className="absolute rounded-full bg-white/95"
        style={{
          width: Math.max(size * 0.32, 2),
          height: Math.max(size * 0.18, 1.5),
          top: size * 0.16,
          left: size * 0.2,
          filter: "blur(0.4px)",
          transform: "rotate(-30deg)",
        }}
      />
    </span>
  );
};

/**
 * Purely decorative floating water bubbles rendered in the empty left/right
 * page margins (outside the centered content column). It is:
 * - `fixed` + `-z-10`: always stays behind real page content, so it can
 *   never cover or intercept any UI.
 * - `pointer-events-none`: never blocks clicks/taps on anything.
 * - `aria-hidden`: invisible to assistive tech, doesn't affect a11y.
 * - hidden below the `xl` breakpoint, where the layout has no side margin.
 *
 * `--bubble-margin` tracks the real empty margin width beside the page's
 * centered content column (which caps at 1280px, then 1550px at `2xl` —
 * matching `HomePage`/`Container`), so bubbles can spread across the full
 * margin instead of leaving a gap next to the content edge.
 */
const FloatingBubbles: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden xl:block [--bubble-margin:calc((100vw_-_1280px)/2)] 2xl:[--bubble-margin:max(0px,calc((100vw_-_1550px)/2))]"
    >
      {BUBBLES.map((bubble, index) => (
        <Bubble key={index} config={bubble} />
      ))}
    </div>
  );
};

export default FloatingBubbles;
