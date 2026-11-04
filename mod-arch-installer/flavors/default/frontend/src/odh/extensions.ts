import type {
  NavExtension,
  RouteExtension,
  AreaExtension,
} from '@odh-dashboard/plugin-core/extension-points';
// The SupportedArea entry and feature flag must be registered in the host before building:
// see the odh-dashboard /module-onboarding skill (Phase 3).
import { SupportedArea } from '@odh-dashboard/plugin-core/areas';

const extensions: (NavExtension | RouteExtension | AreaExtension)[] = [
  {
    type: 'app.area',
    properties: {
      id: SupportedArea.PLUGIN_MOD_ARCH,
      featureFlags: ['modArch'],
    },
  },
  {
    type: 'app.navigation/section',
    flags: {
      required: [SupportedArea.PLUGIN_MOD_ARCH],
    },
    properties: {
      id: 'mod-arch',
      title: 'Mod Arch',
      group: '7_mod_arch_studio',
      iconRef: () => import('./ModArchNavIcon'),
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.PLUGIN_MOD_ARCH],
    },
    properties: {
      id: 'mod-arch-view',
      title: 'Mod Arch',
      href: '/mod-arch/main-view',
      section: 'mod-arch',
      path: '/mod-arch/main-view/*',
      label: 'Tech Preview',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.PLUGIN_MOD_ARCH],
    },
    properties: {
      path: '/mod-arch/main-view/*',
      component: () => import('./ModArchWrapper'),
    },
  },
];

export default extensions;
