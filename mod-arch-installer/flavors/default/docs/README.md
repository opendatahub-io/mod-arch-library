# Default Flavor Notes

The default flavor removes Kubeflow dependencies in favor of a PatternFly-first experience suitable for ODH/RHOAI downstream contributions.

## Changes

- Removes `mod-arch-kubeflow` dependency and ThemeProvider usage.
- Replaces Kubeflow branding with shared PatternFly assets.
- Ensures namespace selector behavior remains consistent with optional mandatory namespace settings.
