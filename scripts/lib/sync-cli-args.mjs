import { FIXTURE_CSV_URL } from './fixtures.mjs';

/**
 * @param {string[]} argv
 * @param {string} usage
 */
export function parseSyncCliArgs(argv, usage) {
  /** @type {{ dryRun: boolean, env: string | null, fixturesFile: string | null, fixturesUrl: string | null, fixturesTz: string | null }} */
  const args = {
    dryRun: true,
    env: null,
    fixturesFile: null,
    fixturesUrl: null,
    fixturesTz: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--env' && argv[i + 1]) args.env = argv[++i];
    else if (a === '--fixtures-file' && argv[i + 1]) args.fixturesFile = argv[++i];
    else if (a === '--fixtures-url' && argv[i + 1]) args.fixturesUrl = argv[++i];
    else if (a === '--fixtures-tz' && argv[i + 1]) args.fixturesTz = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log(usage.replace('{{FIXTURE_CSV_URL}}', FIXTURE_CSV_URL));
      process.exit(0);
    }
  }

  return args;
}
