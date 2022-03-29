import React from 'react';

import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../../../tailwind.config.js';
import { Meta } from '@storybook/react';
import { H1, H2 } from '../Heading/index';
import { Swatch } from './components/Swatch';

export default {
  title: 'Design Guide/Transitions',
} as Meta;

const config = resolveConfig(tailwindConfig);

export const Transitions = () => (
  <div>
    <H1>Transitions</H1>
    <H2>Duration</H2>
    <div className="tw-flex tw-flex-row tw-flex-wrap tw-mb-6">
      {Object.entries<string>(config.theme.transitionDuration)
        .sort((a, b) => parseInt(String(a[1])) - parseInt(String(b[1])))
        .map(([key, value]) => (
          <Swatch
            label={key}
            value={value}
            className={`tw-m-2 tw-transition-all tw-duration-${key} tw-bg-gray-4 tw-transform hover:tw-z-50 hover:tw-bg-sov-white hover:tw-scale-125`}
          />
        ))}
    </div>
    <H2>Function</H2>
    <div className="tw-flex tw-flex-row tw-flex-wrap tw-mb-6">
      {Object.entries<string>(config.theme.transitionTimingFunction)
        .sort((a, b) => parseInt(String(a[1])) - parseInt(String(b[1])))
        .map(([key, value]) => (
          <Swatch
            label={key}
            value={value}
            className={`tw-m-2 tw-transition-all tw-ease-${key} tw-duration-1000 tw-bg-gray-4 tw-transform hover:tw-z-50 hover:tw-bg-sov-white hover:tw-scale-125`}
          />
        ))}
    </div>
  </div>
);
