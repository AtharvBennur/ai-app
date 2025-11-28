/**
 * Simple orchestrator to install dependencies (if needed) and
 * start both backend (ts-node-dev) and frontend (Vite) with a single
 * `node server.js` command.
 */
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const backendDir = __dirname;
const frontendDir = path.resolve(__dirname, '../frontend');
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const forceInstall = process.argv.includes('--force-install');
const spawnOpts = { shell: isWindows };

const installDependencies = async (cwd, label) => {
  const hasNodeModules = existsSync(path.join(cwd, 'node_modules'));

  if (hasNodeModules && !forceInstall) {
    console.log(`✔ ${label} dependencies already installed.`);
    return;
  }

  console.log(
    forceInstall
      ? `⏳ Force installing ${label} dependencies...`
      : `⏳ Installing ${label} dependencies...`,
  );
  await runCommand(npmCmd, ['install'], { cwd, stdio: 'inherit' });
  console.log(`✔ Finished installing ${label} dependencies.`);
};

const runCommand = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...spawnOpts,
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });

const spawnBackground = (command, args, options = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    ...spawnOpts,
    ...options,
  });

  child.on('exit', (code, signal) => {
    console.log(`${command} ${args.join(' ')} exited with ${signal ?? code}`);
    process.exit(code ?? 0);
  });

  return child;
};

const gracefulShutdown = (processes) => {
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`\nReceived ${signal}. Shutting down...`);
      processes.forEach((proc) => proc.kill(signal));
      setTimeout(() => process.exit(0), 500);
    });
  });
};

(async () => {
  try {
    await installDependencies(backendDir, 'backend');
    await installDependencies(frontendDir, 'frontend');

    const backendProc = spawnBackground(npmCmd, ['run', 'dev:backend'], {
      cwd: backendDir,
    });
    const frontendProc = spawnBackground(npmCmd, ['run', 'dev'], {
      cwd: frontendDir,
    });

    gracefulShutdown([backendProc, frontendProc]);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();


