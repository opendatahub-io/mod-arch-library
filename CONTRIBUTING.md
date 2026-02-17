# Contributing to mod-arch-library

We love your input! We want to make contributing to mod-arch-library as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Pull Request Process

1. Update the README.md or documentation with details of changes if applicable
2. Update the CHANGELOG.md with details of changes
3. The PR must pass all CI tests before being merged
4. At least one maintainer must review and approve the changes

## Development Workflow

### Setting Up Development Environment

1. Clone the repository
   ```
   git clone https://github.com/your-organization/mod-arch-library.git
   cd mod-arch-library
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Build the library
   ```
   npm run build
   ```

### Local Testing

To test your changes locally without publishing to npm:

1. In your library directory, run:
   ```
   npm link
   ```

2. In your consuming project, run:
   ```
   npm link mod-arch-library
   ```

3. After you're done testing, you can unlink by running:
   ```
   npm unlink --no-save mod-arch-library
   ```
   in your consuming project, and:
   ```
   npm unlink
   ```
   in your library directory.

## Adding New Components

When adding new components to the library, please follow these guidelines:

1. Create your component in the appropriate directory (e.g., `/components`)
2. Include proper TypeScript typings
3. Add unit tests in the `__tests__` directory
4. Export your component in the appropriate barrel file (e.g., `components/index.ts`)
5. Consider adding documentation and usage examples

## Code Style

- We use ESLint for linting
- We follow TypeScript best practices
- Components should be functional with React hooks
- Use meaningful variable and function names
- Include JSDoc comments for better documentation

## Releases

Releases are automated via [semantic-release](https://github.com/semantic-release/semantic-release). Version bumps are determined by the **PR title**, since we use GitHub squash merge (the PR title becomes the commit message on `main`).

### How it works

1. PR titles are validated against [Conventional Commits](https://www.conventionalcommits.org/) format by CI
2. On merge to `main`, semantic-release parses the squash commit message and determines the version bump
3. Packages are versioned, tagged, and published automatically

### PR title → version mapping

| PR title prefix | Version bump | Example |
| --------------- | ------------ | ------- |
| `feat:` | Minor (0.x.0) | `feat: add chart color tokens` |
| `fix:` | Patch (0.0.x) | `fix: backdrop z-index overlap` |
| `perf:` | Patch | `perf: reduce theme bundle size` |
| `revert:` | Patch | `revert: undo token rename` |
| `refactor:` | No release | `refactor: simplify theme context` |
| `style:` | No release | `style: format SCSS files` |
| `docs:` | No release | `docs: update theming guide` |
| `test:` | No release | `test: add hook coverage` |
| `chore:` | No release | `chore: update dependencies` |

### Breaking changes

**Major version bumps are intentionally blocked from automated releases.** Even if a commit includes `BREAKING CHANGE` in its footer or uses the `!` suffix (e.g., `feat!: rename theme API`), semantic-release will **not** create a major release.

Breaking changes require a manual release process:

1. Open a PR with the breaking change, using a `feat:` or `fix:` prefix as appropriate
2. Document the breaking change clearly in the PR description
3. After merge, a maintainer must trigger the manual publish workflow (`Actions → Manually Publish`) with the appropriate package selection
4. Update the version manually in `package.json` files before running the workflow if a major bump is needed

### Manual publish

For ad-hoc releases (including major versions), use the **Manually Publish** workflow in GitHub Actions. It supports publishing individual packages or all packages at once.

## PR Title Format

PR titles **must** follow [Conventional Commits](https://www.conventionalcommits.org/) format. CI will block PRs with non-conforming titles. The allowed prefixes are:

- `feat:` - A new feature
- `fix:` - A bug fix
- `perf:` - A performance improvement
- `revert:` - Reverting a previous change
- `refactor:` - A code change that neither fixes a bug nor adds a feature
- `style:` - Changes that do not affect the meaning of the code
- `docs:` - Documentation only changes
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to the build process or auxiliary tools
- `ci:` - CI/CD configuration changes
- `build:` - Build system changes

Scopes are optional but encouraged for clarity: `feat(kubeflow): add chart color tokens`

## License

By contributing, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE).