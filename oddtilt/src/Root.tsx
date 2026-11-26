import React from 'react';
import {Composition, Still} from 'remotion';
import {Turnaround} from './Turnaround';
import {Short, TOTAL} from './Short';
export const Root: React.FC = () => (
  <>
    <Still id="WolfTurnaround" component={Turnaround} width={1920} height={1080} />
    <Composition id="Short" component={Short} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Preview" component={Short} durationInFrames={TOTAL} fps={30} width={540} height={960} />
  </>
);
