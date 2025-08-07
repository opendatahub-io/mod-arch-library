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

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your-organization/mod-arch-library/tags).

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Changes that do not affect the meaning of the code
- `refactor:` - A code change that neither fixes a bug nor adds a feature
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to the build process or auxiliary tools and libraries

## License

By contributing, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE).