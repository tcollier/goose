import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { replaceWithShims, SHIM_COMMANDS } from './shims';
import { join as joinPath } from 'path';
import { existsSync, statSync } from 'fs';

describe('SHIM_COMMANDS', () => {
  const BINARY_DIR = joinPath(__dirname, '..', '..', 'src', 'bin');

  it('has a shim for `goosed`', () => {
    expect(SHIM_COMMANDS).toContain('goosed');
  });

  it('has a shim for `jbang`', () => {
    expect(SHIM_COMMANDS).toContain('jbang');
  });

  it('has a shim for `npx`', () => {
    expect(SHIM_COMMANDS).toContain('npx');
  });

  it('has a shim for `uvx`', () => {
    expect(SHIM_COMMANDS).toContain('uvx');
  });

  SHIM_COMMANDS.forEach((cmd) => {
    it(`has an executable in the binary path for ${cmd}`, async () => {
      const expectedBinaryPath = joinPath(BINARY_DIR, cmd);
      if (!existsSync(expectedBinaryPath)) {
        throw new Error(`Expected shim for ${cmd} at ${expectedBinaryPath} does not exist`);
      } else if (!statSync(expectedBinaryPath).isFile()) {
        throw new Error(`Expected shim for ${cmd} at ${expectedBinaryPath} is not a file`);
      }
    });
  });
});

describe('replaceWithShims', () => {
  const originalElectron = window.electron;
  const originalLog = console.log;

  beforeEach(() => {
    window.electron = {
      ...window.electron,
      getBinaryPath: jest.fn().mockImplementation((cmd) => Promise.resolve(`/path/to/${cmd}`)) as (
        binaryName: string
      ) => Promise<string>,
    };
    console.log = jest.fn();
  });

  afterEach(() => {
    window.electron = originalElectron;
    console.log = originalLog;
  });

  it('returns the input command string if it is not a known shim', async () => {
    const cmd = 'unknown-command';
    const result = await replaceWithShims(cmd);
    expect(result).toBe(cmd);
  });

  SHIM_COMMANDS.forEach((cmd) => {
    it(`returns the exectuable path to the shim for ${cmd}`, async () => {
      const result = await replaceWithShims(cmd);
      expect(result).toBe(`/path/to/${cmd}`);
    });
  });
});
