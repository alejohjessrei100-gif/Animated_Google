import {Config} from '@remotion/cli/config';
Config.setChromiumOpenGlRenderer('swangle');
Config.setConcurrency(2);
// Cloud sessions: use a pre-installed headless shell when present (CHROME_BIN overrides).
import fs from 'fs';
const local = process.env.CHROME_BIN || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(local)) Config.setBrowserExecutable(local);
