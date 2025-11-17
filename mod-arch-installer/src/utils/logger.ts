import pc from 'picocolors';

export const logger = {
  info(message: string) {
    console.log(pc.cyan('[mod-arch-installer]'), message);
  },
  success(message: string) {
    console.log(pc.green('[mod-arch-installer]'), message);
  },
  warn(message: string) {
    console.warn(pc.yellow('[mod-arch-installer]'), message);
  },
  error(message: string) {
    console.error(pc.red('[mod-arch-installer]'), message);
  },
};
