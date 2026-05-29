import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import type { CalculateMetadataFunction } from "remotion";

const FPS = 30;
const CROSSFADE_FRAMES = 30; // 1s crossfade between clips 1→2 and 2→3
const SLIDE_FRAMES = 60; // 2s slide-in for clip 4 from the bottom

type Props = {
  durations: number[];
};

export const calculateMetadataFn: CalculateMetadataFunction<Props> = async () => {
  const files = ["1.mp4", "2.mp4", "3.mp4", "4.mp4", "5.mp4"];
  const durations = await Promise.all(
    files.map(async (f) => {
      const meta = await getVideoMetadata(staticFile(f));
      return Math.round(meta.durationInSeconds * FPS);
    })
  );

  const [d1, d2, d3, , d5] = durations;
  // Clips overlap during crossfades, so total shrinks by CROSSFADE_FRAMES × 2
  const total = d1 + d2 + d3 + d5 - CROSSFADE_FRAMES * 2;

  return {
    durationInFrames: total,
    props: { durations },
  };
};

// Crossfade wrapper — fades in over CROSSFADE_FRAMES at the start of each segment
const FadeIn: React.FC<{ children: React.ReactNode; durationFrames: number }> = ({
  children,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// Video 4 slides in from the bottom
const Video4Slide: React.FC = () => {
  const frame = useCurrentFrame();
  const translateY = interpolate(frame, [0, SLIDE_FRAMES], [100, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        transform: `translateY(${translateY}%)`,
      }}
    >
      <OffthreadVideo
        src={staticFile("4.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC<Props> = ({ durations }) => {
  const [d1, d2, d3, , d5] = durations;

  // Each clip starts CROSSFADE_FRAMES earlier than a pure sequential timeline
  const start1 = 0;
  const start2 = d1 - CROSSFADE_FRAMES;
  const start3 = start2 + d2 - CROSSFADE_FRAMES;
  const slideStart = start3 + d3 - SLIDE_FRAMES; // 4 starts sliding while 3 is still playing
  const start5 = start3 + d3;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Clip 1 */}
      <Sequence from={start1} durationInFrames={d1}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("1.mp4")}
            style={{ width: "100%", height: "100%" }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Clip 2 — fades in over clip 1 */}
      <Sequence from={start2} durationInFrames={d2}>
        <FadeIn durationFrames={CROSSFADE_FRAMES}>
          <OffthreadVideo
            src={staticFile("2.mp4")}
            style={{ width: "100%", height: "100%" }}
          />
        </FadeIn>
      </Sequence>

      {/* Clip 3 — fades in over clip 2 */}
      <Sequence from={start3} durationInFrames={d3}>
        <FadeIn durationFrames={CROSSFADE_FRAMES}>
          <OffthreadVideo
            src={staticFile("3.mp4")}
            style={{ width: "100%", height: "100%" }}
          />
        </FadeIn>
      </Sequence>

      {/* Clip 4 — black bg, slides up from bottom during last 2s of clip 3 */}
      <Sequence from={slideStart} durationInFrames={SLIDE_FRAMES}>
        <Video4Slide />
      </Sequence>

      {/* Clip 5 — plays after clip 3 ends */}
      <Sequence from={start5} durationInFrames={d5}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("5.mp4")}
            style={{ width: "100%", height: "100%" }}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
