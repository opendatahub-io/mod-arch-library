# Golden Path: Team Onboarding to Modular Architecture

## What is a Golden Path?

A **Golden Path** is the opinionated and supported path to build, deploy, and maintain systems within our modular architecture. Our Golden Path provides step-by-step guidance that reduces complexity, eliminates decision paralysis, and enables teams to focus on delivering value rather than reinventing infrastructure patterns.

### Key Principles

- **Opinionated**: We make the hard decisions so you don't have to
- **Supported**: Full tooling, documentation, and platform team assistance
- **Educational**: Understanding the why behind each step
- **Tested**: Proven path used by successful teams
- **Evolving**: Continuously improved based on real-world feedback

## The Golden Path Philosophy

Our Golden Path addresses common challenges in software development ecosystems:

> *"The Golden Path is the opinionated and supported path to build your system and the Golden Path tutorial walks you through this path"*

In our modular architecture context, the Golden Path represents:

1. **The fastest way** to get a new team productive with modular development
2. **The safest approach** using battle-tested patterns and technologies
3. **The most supported route** with comprehensive documentation and tooling
4. **The educational journey** that builds deep understanding of modular principles

## Team Onboarding Golden Path

This comprehensive guide walks new teams through every step of adopting modular architecture, from initial understanding to production deployment.

### Phase 1: Foundation and Understanding (Week 1)

#### Day 1-2: Strategic Context and Vision

**Goal**: Understand the business case and strategic vision

**Steps**:

1. **Read the Foundation Documents**
   - [ ] Review [Executive Summary](./01-executive-summary.md) - understand business goals and ROI
   - [ ] Study [Current State Analysis](./02-current-state-analysis.md) - understand the problems we're solving
   - [ ] Explore [Benefits and Value](./06-benefits-and-value.md) - see the specific advantages for your team

2. **Team Assessment Workshop** (2 hours)

   Use our [Team Assessment Template](./team-assessment-template.md) to evaluate your team's current state and requirements.

   **Workshop questions to answer:**
   - What are your current pain points?
   - What type of application are you building?
   - What's your team's expertise level?
   - What are your deployment requirements?

3. **Architecture Overview Session**
   - [ ] Review [Architecture Overview](./03-architecture-overview.md)
   - [ ] Understand [Core Patterns](./04-core-patterns.md)
   - [ ] Map your use case to [Implementation Approaches](./05-implementation-approaches.md)

**Deliverable**: Team Assessment Document and Architecture Approach Decision

#### Day 3-5: Technology Foundation

**Goal**: Establish technical understanding and development environment

**Steps**:

1. **Technology Stack Deep Dive**
   - [ ] Study [Technology Standards](./07-technology-standards.md)
   - [ ] Understand the mod-arch-shared library requirements
   - [ ] Review [Development Workflow](./08-development-workflow.md)

2. **Environment Setup** (Follow our standard setup)

   ```bash
   # 1. Clone the shared library
   git clone https://github.com/opendatahub-io/kubeflow-ui-essentials.git
   cd kubeflow-ui-essentials
   
   # 2. Install dependencies
   npm install
   
   # 3. Set up development environment
   npm run setup:dev
   
   # 4. Run the example application
   npm run dev:example
   ```

3. **Hands-on Tutorial**
   - [ ] Complete the basic [Getting Started](./10-getting-started.md) tutorial
   - [ ] Build and run the example application
   - [ ] Explore the [Shared Library Guide](./12-shared-library-guide.md)

**Deliverable**: Working development environment and completed tutorial

### Phase 2: Practical Implementation (Week 2)

#### Day 6-8: First Modular Application

**Goal**: Build your first modular application using the Golden Path

**Steps**:

1. **Project Initialization**

   ```bash
   # Use our project template generator
   npx @mod-arch/create-module \
     --name="team-hello-world" \
     --type="standalone" \
     --platform="rhoai" \
     --team="your-team-name"
   
   cd team-hello-world
   ```

2. **Core Implementation**
   - [ ] Follow the [Getting Started Guide](./10-getting-started.md) new project section
   - [ ] Implement required context providers from [Technology Standards](./07-technology-standards.md)
   - [ ] Create your first components using [Component Library](./14-component-library.md)

3. **API Integration**
   - [ ] Study [API Integration](./13-api-integration.md) patterns
   - [ ] Implement BFF following our standards
   - [ ] Set up authentication and authorization

**Example First Application Structure**:

```typescript
// src/App.tsx - Golden Path application setup
import React from 'react';
import {
  ModularArchContextProvider,
  ThemeProvider,
  BrowserStorageContextProvider,
  NotificationContextProvider,
  Theme,
  DeploymentMode
} from 'mod-arch-shared';

const goldenPathConfig = {
  platformMode: 'rhoai',
  deploymentMode: DeploymentMode.STANDALONE,
  URL_PREFIX: process.env.URL_PREFIX || '',
  BFF_API_VERSION: 'v1',
  enableNotifications: true,
  enableErrorBoundary: true,
};

const App: React.FC = () => (
  <ModularArchContextProvider config={goldenPathConfig}>
    <ThemeProvider theme={Theme.Patternfly}>
      <BrowserStorageContextProvider>
        <NotificationContextProvider>
          <YourTeamApplication />
        </NotificationContextProvider>
      </BrowserStorageContextProvider>
    </ThemeProvider>
  </ModularArchContextProvider>
);

export default App;
```

**Deliverable**: Working modular application with all Golden Path patterns

#### Day 9-10: Advanced Integration

**Goal**: Integrate advanced patterns and prepare for production

**Steps**:

1. **Advanced Patterns Implementation**
   - [ ] Study [Advanced Patterns](./15-advanced-patterns.md)
   - [ ] Implement error boundaries and loading states
   - [ ] Add comprehensive logging and monitoring

2. **Module Federation Setup** (if needed)
   - [ ] Review [Module Federation Integration](./17-module-federation-integration.md)
   - [ ] Configure webpack for remote module
   - [ ] Create extension points for dashboard integration

3. **Testing and Quality**

   ```bash
   # Run the full Golden Path test suite
   npm run test:golden-path
   
   # Includes:
   # - Unit tests with mod-arch-shared utilities
   # - Integration tests with mocked APIs
   # - E2E tests with cypress
   # - Bundle analysis and performance tests
   ```

**Deliverable**: Production-ready modular application with advanced patterns

### Phase 3: Production and Integration (Week 3)

#### Day 11-13: Deployment and Production

**Goal**: Deploy to production environments following Golden Path standards

**Steps**:

1. **Deployment Configuration**
   - [ ] Study deployment patterns in [Implementation Approaches](./05-implementation-approaches.md)
   - [ ] Set up Kubernetes manifests using our templates
   - [ ] Configure environment-specific settings

2. **Production Deployment**

   ```bash
   # Use our standard deployment pipeline
   kubectl apply -f manifests/golden-path/
   
   # Verify deployment
   kubectl get pods -l app=team-hello-world
   kubectl logs -l app=team-hello-world
   ```

3. **Monitoring and Observability**
   - [ ] Set up standard monitoring using our observability stack
   - [ ] Configure alerts and dashboards
   - [ ] Implement health checks and readiness probes

**Deliverable**: Live production application following all Golden Path standards

#### Day 14-15: Real-World Case Study

**Goal**: Learn from real implementations and plan your actual project

**Steps**:

1. **Case Study Deep Dive**
   - [ ] Study [Model Registry Case Study](./16-model-registry-case-study.md)
   - [ ] Understand real-world challenges and solutions
   - [ ] Map lessons learned to your project

2. **Project Planning Session**
   - [ ] Define your team's actual modular application requirements
   - [ ] Create implementation roadmap using Golden Path principles
   - [ ] Plan migration strategy if coming from existing application

3. **Platform Team Consultation**
   - [ ] Schedule architecture review with platform team
   - [ ] Discuss specific requirements and constraints
   - [ ] Get approval for any deviations from Golden Path

**Deliverable**: Approved project plan and architecture for your real application

### Phase 4: Production Excellence (Week 4)

#### Day 16-18: Building Your Real Application

**Goal**: Apply Golden Path to your actual production requirements

**Steps**:

1. **Real Project Implementation**
   - Use everything learned in the Golden Path tutorial
   - Follow the same patterns and standards
   - Leverage platform team support for complex requirements

2. **Advanced Integration Patterns**
   - Multi-service integration
   - Complex state management
   - Advanced error handling and resilience

3. **Performance Optimization**
   - Bundle optimization
   - Lazy loading strategies
   - Caching and CDN integration

#### Day 19-20: Team Mastery and Graduation

**Goal**: Achieve team autonomy and become Golden Path advocates

**Steps**:

1. **Knowledge Validation**

   ```bash
   # Complete our Golden Path certification
   npm run test:certification
   
   # Includes:
   # - Architectural decision scenarios
   # - Debugging common issues
   # - Best practices assessment
   ```

2. **Feedback and Improvement**
   - [ ] Provide feedback on Golden Path experience
   - [ ] Suggest improvements to documentation
   - [ ] Identify areas needing better support

3. **Community Contribution**
   - [ ] Share your learnings with other teams
   - [ ] Contribute to shared library improvements
   - [ ] Become a Golden Path mentor for future teams

**Deliverable**: Golden Path certification and production application

## Golden Path Technologies

Our curated technology stack that provides the "blessed" and fully supported development experience:

### Frontend Stack

- **Framework**: React 18+ with TypeScript
- **UI Library**: PatternFly React 5+
- **State Management**: React Context + mod-arch-shared utilities
- **Routing**: React Router 6+
- **Build Tool**: Webpack 5 with Module Federation
- **Testing**: Jest + React Testing Library + Cypress

### Backend Stack

- **Language**: Go 1.19+
- **Framework**: Gin or Fiber with shared middleware
- **API Style**: REST with OpenAPI specification
- **Database**: PostgreSQL with shared connection utilities
- **Authentication**: Kubernetes RBAC + JWT tokens
- **Monitoring**: Prometheus + Grafana

### Infrastructure Stack

- **Container**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with standard manifests
- **Service Mesh**: Istio (optional but recommended)
- **Monitoring**: OpenShift monitoring stack
- **CI/CD**: GitHub Actions with shared workflows

### Shared Library Integration

- **Core**: mod-arch-shared for all React applications
- **Backend**: Shared Go modules for common utilities
- **Testing**: Shared test utilities and mocks
- **Deployment**: Standard Kubernetes manifests and Helm charts

## Success Factors

Based on industry best practices and our own experience, these factors are critical for Golden Path success:

### 1. Clearly Defined Audience

**Target**: New teams adopting modular architecture

- Assumes basic Kubernetes and React knowledge
- Provides clear learning progression
- Includes both technical and strategic context

### 2. Step-by-Step Precision

**Approach**: Every click, every command documented

- No assumed knowledge gaps
- Copy-pasteable commands
- Clear success criteria for each step

### 3. Educational Focus

**Goal**: Understanding, not just execution

- Explains the "why" behind each decision
- Provides context for when to deviate
- Builds long-term architectural thinking

### 4. Real-World Validation

**Method**: Continuous feedback and improvement

- Every new team provides feedback
- Regular updates based on real usage
- Quarterly reviews with platform team

### 5. Opinionated but Flexible

**Balance**: Strong defaults with escape hatches

- 80% use cases covered by default path
- Clear guidance for edge cases
- Platform team support for complex scenarios

## Golden State Assessment

Use this checklist to verify your team has achieved "Golden State" - full alignment with modular architecture best practices:

### Technical Standards ✅

- [ ] Uses mod-arch-shared as foundation
- [ ] Implements all required context providers
- [ ] Follows TypeScript and React standards
- [ ] Uses PatternFly for UI consistency
- [ ] Implements proper error boundaries

### Architecture Patterns ✅

- [ ] Clear separation of concerns
- [ ] BFF pattern for API integration
- [ ] Proper state management
- [ ] Module federation ready (if applicable)
- [ ] Performance optimized

### Development Workflow ✅

- [ ] Uses shared development tools
- [ ] Implements comprehensive testing
- [ ] Follows CI/CD best practices
- [ ] Has proper monitoring and alerts
- [ ] Documents architectural decisions

### Team Practices ✅

- [ ] Regular architecture reviews
- [ ] Contributes to shared libraries
- [ ] Mentors other teams
- [ ] Provides feedback on Golden Path
- [ ] Follows upstream-first development

## Deviation Guidelines

While we encourage following the Golden Path, we understand some scenarios require deviation:

### When Deviation is Acceptable

1. **Performance Requirements**: Proven performance needs that require alternative solutions
2. **Legacy Integration**: Complex integration with existing systems
3. **Experimental Features**: Pilot programs for new technologies
4. **Platform Limitations**: Technical constraints beyond team control

### Deviation Process

1. **Document Rationale**: Clear business or technical justification
2. **Platform Consultation**: Review with platform team
3. **Risk Assessment**: Understand support and maintenance implications
4. **Migration Plan**: Strategy to return to Golden Path when possible

### Support Levels

- **Golden Path**: Full platform team support and guaranteed compatibility
- **Silver Path**: Community support with best-effort compatibility
- **Off-Path**: Team responsibility with minimal platform support

## Continuous Improvement

The Golden Path evolves based on:

### Team Feedback

- Post-onboarding surveys
- Quarterly retrospectives
- Pain point identification
- Success story analysis

### Technology Evolution

- Regular technology stack reviews
- Evaluation of new tools and patterns
- Migration guides for major updates
- Deprecation timelines for old patterns

### Business Requirements

- New platform requirements
- Compliance and security updates
- Performance and scale improvements
- Integration with new services

## Support and Resources

### Platform Team Support

- **Golden Path Questions**: #modular-arch-golden-path Slack channel
- **Architecture Reviews**: Weekly office hours
- **Escalations**: Direct platform team contact
- **Training**: Monthly workshops and lunch-and-learns

### Self-Service Resources

- **Documentation**: This comprehensive guide and all referenced docs
- **Examples**: Working examples in the shared library repository
- **Templates**: Project generators and boilerplate code
- **Tools**: Automated testing and validation utilities

### Community

- **Teams Channel**: Share experiences with other Golden Path teams
- **Monthly Meetups**: Learn from successful implementations
- **Contribution Guidelines**: How to improve the Golden Path
- **Mentorship Program**: Connect with experienced teams

## Measuring Success

### Team Velocity Metrics

- **Time to First Deploy**: From team formation to first production deployment
- **Development Velocity**: Story points delivered per sprint after adoption
- **Defect Rates**: Production issues and time to resolution
- **Developer Satisfaction**: Team happiness and productivity scores

### Platform Health Metrics

- **Golden Path Adoption**: Percentage of teams using Golden Path
- **Support Ticket Volume**: Questions and issues requiring platform support
- **Documentation Effectiveness**: Self-service success rate
- **Technology Standardization**: Consistency across teams

### Business Impact Metrics

- **Feature Delivery**: Faster time to market for new features
- **Maintenance Cost**: Reduced operational overhead
- **Developer Onboarding**: Faster new team member productivity
- **Technical Debt**: Reduction in legacy system complexity

---

## Next Steps

Ready to start your Golden Path journey? Here's what to do:

1. **Schedule Golden Path Kickoff** with platform team
2. **Assemble Your Team** for the 4-week onboarding program
3. **Block Calendar Time** for dedicated Golden Path focus
4. **Join the Community** on Slack and attend the next monthly meetup

The Golden Path is your team's fastest route to modular architecture success. Let's begin the journey! 🎯

---

**Related Documentation:**

- [Team Assessment Template](./team-assessment-template.md) - Comprehensive assessment tool for starting teams
- [Getting Started Guide](./10-getting-started.md) - Detailed technical setup
- [Technology Standards](./07-technology-standards.md) - Complete technical requirements
- [Module Federation Integration](./17-module-federation-integration.md) - Dashboard integration patterns
- [Model Registry Case Study](./16-model-registry-case-study.md) - Real-world implementation example
