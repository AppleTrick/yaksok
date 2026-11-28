// The yaksok theme. `astryx experimental theme editor` wrote this file once and never changes it again.
// The checked settings live in yaksok.settings.json and the generated yaksok.settings.ts;
// change them with `astryx experimental theme editor set yaksok ...`. Add your own changes below: they win over the settings.
import {defineTheme} from '@astryxdesign/core/theme';
import {yaksokSettings} from './yaksok.settings';

export const yaksokTheme = defineTheme({
  extends: yaksokSettings,
  name: 'yaksok',
});
