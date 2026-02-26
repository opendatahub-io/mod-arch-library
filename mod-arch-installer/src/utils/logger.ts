import pc from 'picocolors';

export const logger = {
  log(message: string) {
    console.log(message);
  },
  info(message: string) {
    console.log(pc.cyan('  ●'), message);
  },
  success(message: string) {
    console.log(pc.green('  ✓'), message);
  },
  warn(message: string) {
    console.warn(pc.yellow('  ⚠'), message);
  },
  error(message: string) {
    console.error(pc.red('  ✗'), message);
  },
  step(step: number, total: number, message: string) {
    const stepText = pc.dim(`[${step}/${total}]`);
    console.log(`  ${stepText} ${message}`);
  },
  banner() {
    console.log('');
    console.log(pc.bold(pc.magenta('  ╔═════════════════════════════════════════════╗')));
    console.log(pc.bold(pc.magenta('  ║')) + pc.bold('    🚀 Modular Architecture Installer      ') + pc.bold(pc.magenta('║')));
    console.log(pc.bold(pc.magenta('  ╚═════════════════════════════════════════════╝')));
    console.log('');
  },
  header(text: string) {
    console.log('');
    console.log(pc.bold(pc.cyan(`  ◆ ${text}`)));
    console.log(pc.dim('  ─────────────────────────────────────────'));
  },
  listItem(text: string, indent = 2) {
    const spaces = ' '.repeat(indent);
    console.log(`${spaces}${pc.dim('›')} ${text}`);
  },
  command(cmd: string) {
    console.log(`    ${pc.cyan('$')} ${pc.bold(pc.white(cmd))}`);
  },
  link(text: string, url: string) {
    console.log(`    ${pc.blue(text)}: ${pc.underline(pc.cyan(url))}`);
  },
  divider() {
    console.log(pc.dim('  ─────────────────────────────────────────'));
  },
  blank() {
    console.log('');
  },
};
