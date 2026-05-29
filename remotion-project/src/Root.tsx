import "./index.css";
import { Composition } from "remotion";
import { MyComposition, calculateMetadataFn } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MyComp"
      component={MyComposition}
      calculateMetadata={calculateMetadataFn}
      durationInFrames={1}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{ durations: [90, 90, 90, 90, 90] }}
    />
  );
};
