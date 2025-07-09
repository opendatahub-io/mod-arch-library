# Contributing to mod-arch-shared

Welcome! We're excited that you want to contribute to the Modular Architecture Shared Library. This guide will help you get started with contributing to this TypeScript-based shared component library.

## 🎯 Overview

The `mod-arch-shared` library is the cornerstone of our modular architecture initiative, providing common UI components, utilities, and context management for micro-frontend applications. Your contributions help improve the foundation that many projects depend on.

## 🚀 Quick Start

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/kubeflow-ui-essentials.git
   cd kubeflow-ui-essentials
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build and test**

   ```bash
   npm run build
   npm test
   npm run lint
   ```

### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [coding standards](#-coding-standards)

3. **Test your changes**

   ```bash
   npm test
   npm run build
   ```

4. **Commit and push**

   ```bash
   git commit -m "feat: add new component for..."
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** with a clear description of your changes

## 📝 What Can You Contribute?

### 🐛 Bug Fixes

- Report bugs using GitHub issues
- Include steps to reproduce and expected behavior
- Submit fixes with tests when possible

### ✨ New Features

- Propose new components or utilities
- Ensure they align with modular architecture principles
- Include documentation and tests

### 📖 Documentation

- Improve existing documentation
- Add examples and use cases
- Update type definitions

### 🧪 Testing

- Add missing test coverage
- Improve existing tests
- Add integration tests

## 🔧 Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide proper type definitions for all exports
- Follow existing naming conventions

### Component Guidelines

- Create reusable, modular components
- Follow React best practices (hooks, functional components)
- Ensure accessibility (ARIA labels, keyboard navigation)
- Support both PatternFly and MUI theming

### Testing Requirements

- Write unit tests for new functionality
- Maintain or improve test coverage
- Test components in different deployment modes
- Include integration tests for context providers

## 📋 Pull Request Process

1. **Pre-submission checklist:**
   - [ ] Tests pass (`npm test`)
   - [ ] Build succeeds (`npm run build`)
   - [ ] Linting passes (`npm run lint`)
   - [ ] Documentation updated if needed
   - [ ] Types are properly defined

2. **Review process:**
   - At least one maintainer review required
   - All CI checks must pass
   - Address feedback promptly
   - Squash commits before merge

## 🌟 Recognition

Contributors are recognized in:

- Project README
- Release notes
- Community discussions

## 🤝 Community

- Join our community discussions
- Participate in code reviews
- Help other contributors
- Share feedback and ideas

## 📚 Additional Resources

- [Shared Library Guide](./docs/12-shared-library-guide.md) - Complete technical reference
- [Component Library](./docs/14-component-library.md) - UI component documentation
- [Development Workflow](./docs/08-development-workflow.md) - Upstream-first development practices

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Documentation**: Check the comprehensive guides in `/docs`

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE).

Thank you for contributing to the modular architecture initiative! 🎉