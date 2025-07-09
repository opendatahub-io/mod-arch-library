# Modular Architecture Documentation

Welcome to the comprehensive documentation for our Modular Architecture Initiative - a transformative approach to building scalable, reusable, and maintainable AI platform interfaces.

## Introduction

The Modular Architecture Initiative represents a fundamental shift from monolithic frontend applications to a modular, micro-frontend based approach. This initiative addresses key challenges in scalability, maintainability, and developer productivity while enabling upstream-first development practices.

### Key Benefits

- **🚀 Accelerated Development**: Independent development and deployment of features
- **🔄 Enhanced Reusability**: Components can be shared across multiple projects
- **🌐 Upstream-First Approach**: Aligns with open-source communities and best practices
- **📈 Improved Scalability**: Modular architecture supports platform growth
- **👥 Better Developer Experience**: Streamlined workflows and reduced complexity

## Documentation Structure

### 📋 Core Documentation

| Document | Description |
|----------|-------------|
| [**Overview**](./overview.md) | Introduction to modular architecture, current challenges, and strategic goals |
| [**Deployment Modes**](./deployment-modes.md) | Kubeflow, Federated (ODH/RHOAI), and Standalone deployment approaches |
| [**Architecture**](./architecture.md) | Frontend, BFF, and OpenAPI specification patterns |

### 🎯 Getting Started

| Document | Description |
|----------|-------------|
| [**Onboarding**](./onboarding.md) | **Most important** - Primary entry point for new team members with federated and Kubeflow onboarding paths |
| [**Development Flow**](./development-flow.md) | Common patterns, upstream/downstream development, and feature flagging |
| [**Golden Path**](./golden-path.md) | Proven workflows for developing new features and migrating existing ones |

### � Technical Implementation

| Document | Description |
|----------|-------------|
| [**Module Federation**](./module-federation.md) | Configuration, shared libraries, API exposure, and TypeScript type sharing |
| [**Extensibility**](./extensibility.md) | ODH Dashboard extensibility system with plugins and extensions |
| [**Testing**](./testing.md) | Unit testing, integration testing, and E2E testing strategies *(Work in Progress)* |

### � Deployment & Operations

| Document | Description |
|----------|-------------|
| [**Deployment**](./deployment.md) | Kubeflow, ODH/RHOAI deployment strategies and configurations |

## Quick Start Paths

### 🎯 For New Team Members

**Start here if you're new to modular architecture:**

1. **[Onboarding](./onboarding.md)** - Most important entry point with comprehensive guidance
2. **[Overview](./overview.md)** - Understand the architecture vision and goals
3. **[Deployment Modes](./deployment-modes.md)** - Choose your target platform
4. **[Golden Path](./golden-path.md)** - Follow proven development workflows

### 🔄 For Feature Development

**Building new features:**

1. **[Golden Path](./golden-path.md)** - Choose your development scenario
2. **[Development Flow](./development-flow.md)** - Follow common development patterns
3. **[Architecture](./architecture.md)** - Implement frontend, BFF, and API patterns
4. **[Module Federation](./module-federation.md)** - Configure module integration

### 🛠️ For Technical Implementation

**Deep technical guidance:**

1. **[Architecture](./architecture.md)** - Comprehensive technical patterns
2. **[Module Federation](./module-federation.md)** - Advanced module configuration
3. **[Extensibility](./extensibility.md)** - Plugin and extension development
4. **[Deployment](./deployment.md)** - Production deployment strategies

### 🚀 For Platform Operations

**Deployment and operations:**

1. **[Deployment Modes](./deployment-modes.md)** - Understand platform options
2. **[Deployment](./deployment.md)** - Platform-specific deployment guides
3. **[Testing](./testing.md)** - Testing strategies and automation

## Development Scenarios

### Golden Path Scenarios

Choose your development path based on your team's needs:

- **New RHOAI Feature**: [Golden Path - New RHOAI Feature](./golden-path.md#we-are-a-team-that-wants-to-develop-a-new-rhoai-feature)
- **Migrate RHOAI Feature**: [Golden Path - Migration](./golden-path.md#we-are-a-team-that-wants-to-migrate-a-feature-already-in-rhoai-to-modular-architecture)
- **New Kubeflow Feature**: [Golden Path - Kubeflow](./golden-path.md#we-are-a-team-that-wants-to-develop-a-new-feature-into-kubeflow-work-in-progress) *(Work in Progress)*
- **Migrate to Kubeflow**: [Golden Path - Kubeflow Migration](./golden-path.md#we-are-a-team-that-wants-to-migrate-a-feature-into-kubeflow-work-in-progress) *(Work in Progress)*

### Development Approaches

- **Federated Development**: For ODH/RHOAI teams using monorepo structure with Module Federation
- **Upstream Development**: For Kubeflow contributions using standalone mode
- **Downstream Development**: For enterprise-specific features in ODH/RHOAI

## Key Resources

- **Primary Repository**: [kubeflow-ui-essentials](https://github.com/opendatahub-io/kubeflow-ui-essentials)
- **ODH Dashboard**: [odh-dashboard](https://github.com/opendatahub-io/odh-dashboard)
- **Community**: Join our Slack channels and team meetings for support

## Support

- **Documentation Issues**: Create issues in the repository
- **Development Questions**: Join our community channels
- **Architecture Discussions**: Participate in weekly architecture reviews
- **Training**: Regular workshops and onboarding sessions available
- **Reference Implementation**: [Model Registry module](https://github.com/kubeflow/model-registry)
- **Community Support**: Join Kubeflow Slack and community meetings

## Contributing

This documentation is a living resource that evolves with our architecture. For questions, contributions, or support:

- Engage with the platform team through established channels
- Participate in community discussions and meetings
- Contribute improvements to documentation and implementations

---

Last updated: July 2025 | Part of the ongoing Modular Architecture Initiative
