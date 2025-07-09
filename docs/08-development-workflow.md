# Development Workflow

Our development workflow is designed around the **upstream-first** philosophy, ensuring that all reusable functionality is developed in upstream repositories before being integrated into downstream products.

## Core Philosophy: Upstream-First Development

### What is Upstream-First?

**Upstream-First** development means that all new, reusable feature logic must be developed and merged into upstream, platform-agnostic repositories before any work begins on downstream-specific integrations. This approach ensures:

- **Community Alignment**: All development aligns with broader open-source communities
- **Reusability**: Features are designed for reuse from the beginning
- **Quality**: Community review and feedback improve feature quality
- **Sustainability**: Reduces maintenance burden through shared responsibility

### Benefits of Upstream-First

- **Reduced Technical Debt**: Features are designed with reusability in mind
- **Community Engagement**: External contributors can participate in feature development
- **Quality Assurance**: Community review process improves code quality
- **Strategic Alignment**: Aligns development with industry standards and practices

## Development Modes

Our workflow supports three distinct development modes, each serving specific purposes in the development lifecycle:

### 1. Standalone Mode (Primary Development)

**Purpose**: Day-to-day feature development and testing

#### Environment Characteristics

- **Local Machine**: Development happens on developer's local machine
- **Mocked Authentication**: Uses header-based authentication (`kubeflow-user`)
- **No Infrastructure Dependencies**: No need for running Kubernetes clusters
- **Fast Iteration**: Maximum development speed with immediate feedback

#### Setup Process

```bash
# Clone the module repository
git clone https://github.com/kubeflow/model-registry
cd model-registry

# Install frontend dependencies
cd frontend
npm install

# Start the BFF in mock mode
cd ../backend
go run ./cmd/bff --mock-mode

# Start the frontend development server
cd ../frontend
npm start
```

#### Benefits

- **Maximum Development Speed**: No waiting for infrastructure setup
- **Isolated Development**: Work on features without external dependencies
- **Simplified Debugging**: Issues are isolated to the module being developed
- **Resource Efficiency**: Minimal resource requirements on developer machines

### 2. Kubeflow Mode (Integration Testing)

**Purpose**: Testing against real Kubeflow platform services

#### Environment Characteristics

- **Running Kubeflow Cluster**: Requires access to a Kubeflow installation
- **Real Authentication**: Uses Kubeflow's authentication system
- **Live Data**: Works with real platform data and services
- **High Fidelity**: Tests realistic integration scenarios

#### Setup Process

```bash
# Configure kubectl context
kubectl config use-context kubeflow-cluster

# Deploy module to cluster
kubectl apply -f manifests/

# Port forward for local development
kubectl port-forward svc/model-registry-bff 8080:80

# Configure frontend to use cluster BFF
export REACT_APP_BFF_URL=http://localhost:8080
npm start
```

#### Benefits

- **Real Integration Testing**: Validates against actual platform services
- **Data Validation**: Tests with real data structures and volumes
- **Performance Testing**: Evaluates performance under realistic conditions
- **End-to-End Validation**: Complete user journey testing

### 3. Federated Mode (Product Validation)

**Purpose**: Full product-level integration testing

#### Environment Characteristics

- **Complete Platform**: Full downstream platform (e.g., RHOAI) environment
- **Production-Like**: Mirrors production environment configuration
- **Host Authentication**: Uses platform's authentication system
- **Complete Integration**: All modules and features integrated

#### Setup Process

```bash
# Deploy to staging environment
helm upgrade --install platform-release ./charts \
  --values staging-values.yaml

# Run integration tests
npm run test:e2e:federated

# Validate user journeys
cypress run --spec "cypress/integration/federated/**/*"
```

#### Benefits

- **Production Validation**: Tests complete production scenarios
- **User Experience Validation**: Validates complete user experience
- **Performance Validation**: Tests production-level performance
- **Deployment Validation**: Validates deployment and configuration

## Development Flow

### Typical Development Lifecycle

#### 1. Feature Planning

**Activities**:
- Define feature scope and requirements
- Identify upstream vs downstream components
- Plan API contracts between frontend and BFF
- Create technical design documents

**Deliverables**:
- Feature specification document
- API contract definitions (OpenAPI)
- Technical design and architecture decisions
- Development timeline and milestones

#### 2. Local Development (Standalone Mode)

**Activities**:
- Clone relevant repositories
- Set up local development environment
- Develop features in Standalone Mode
- Implement comprehensive unit tests
- Create integration tests for module boundaries

**Best Practices**:
- Use BFF mock mode for rapid iteration
- Implement comprehensive test coverage
- Follow established coding standards
- Regular commits with clear messages

#### 3. Integration Testing (Kubeflow Mode)

**Activities**:
- Deploy module to development Kubeflow cluster
- Test against real platform services
- Validate API contracts and data flows
- Perform end-to-end testing
- Optimize performance and resource usage

**Validation Points**:
- API integration works correctly
- Data flows are properly handled
- Authentication and authorization work
- Performance meets requirements

#### 4. Upstream Contribution

**Activities**:
- Prepare pull requests for upstream repositories
- Participate in community code review process
- Address feedback and iterate on implementation
- Ensure documentation is complete and accurate

**Requirements**:
- Code meets community standards
- Comprehensive test coverage
- Documentation is complete
- Breaking changes are properly communicated

#### 5. Downstream Integration (Federated Mode)

**Activities**:
- Integrate upstream changes into downstream products
- Test complete product integration
- Validate user experience end-to-end
- Deploy to staging and production environments

**Validation Points**:
- Complete user journeys work correctly
- Performance meets production requirements
- Security requirements are satisfied
- Monitoring and observability work correctly

## Code Review and Quality Assurance

### Review Process

#### Internal Review
- **Technical Review**: Code quality, architecture, and implementation
- **Security Review**: Security implications and compliance
- **Performance Review**: Performance characteristics and optimization
- **Documentation Review**: Documentation completeness and accuracy

#### Community Review
- **Upstream Review**: Community review for upstream contributions
- **Standards Compliance**: Adherence to community standards
- **Backward Compatibility**: Impact on existing functionality
- **Test Coverage**: Comprehensive test coverage validation

### Quality Gates

#### Code Quality
- **Linting**: All code passes established linting rules
- **Type Safety**: TypeScript compilation without errors
- **Test Coverage**: Minimum 80% test coverage
- **Security Scanning**: No critical security vulnerabilities

#### Integration Quality
- **API Contracts**: All API contracts validated
- **Cross-Module Integration**: Integration points tested
- **Performance**: Performance requirements met
- **User Experience**: User journeys validated

## Continuous Integration and Deployment

### CI Pipeline Stages

#### 1. Code Quality Checks
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Type check
        run: npm run type-check
      - name: Run tests
        run: npm run test:coverage
```

#### 2. Build and Package
- **Frontend Build**: Create optimized production builds
- **BFF Build**: Compile Go binaries for target platforms
- **Container Images**: Build and tag container images
- **Security Scanning**: Scan containers for vulnerabilities

#### 3. Integration Testing
- **Module Testing**: Test individual modules in isolation
- **Cross-Module Testing**: Test module interactions
- **End-to-End Testing**: Test complete user journeys
- **Performance Testing**: Validate performance characteristics

#### 4. Deployment
- **Development**: Automatic deployment to development environments
- **Staging**: Manual promotion to staging environments
- **Production**: Controlled deployment to production

### Deployment Strategies

#### Blue-Green Deployment
- **Zero Downtime**: Seamless transition between versions
- **Quick Rollback**: Immediate rollback capability
- **Risk Mitigation**: Reduced risk of deployment issues

#### Canary Deployment
- **Gradual Rollout**: Progressive deployment to user subsets
- **Risk Management**: Early detection of issues
- **Performance Monitoring**: Continuous monitoring during rollout

## Collaboration and Communication

### Team Coordination

#### Daily Standups
- **Progress Updates**: Share development progress
- **Blocker Resolution**: Identify and resolve blockers
- **Coordination**: Coordinate cross-team dependencies

#### Sprint Planning
- **Feature Prioritization**: Prioritize features based on business value
- **Capacity Planning**: Plan work based on team capacity
- **Dependency Management**: Identify and plan for dependencies

### Community Engagement

#### Upstream Participation
- **Community Meetings**: Regular participation in upstream meetings
- **Feature Proposals**: Propose new features to community
- **Code Reviews**: Participate in community code reviews
- **Documentation**: Contribute to community documentation

#### Knowledge Sharing
- **Tech Talks**: Share knowledge through technical presentations
- **Documentation**: Maintain comprehensive documentation
- **Mentoring**: Mentor new contributors and team members
- **Best Practices**: Share and evolve best practices

## Tools and Automation

### Development Tools

- **VS Code**: Recommended IDE with standard extensions
- **Git**: Version control with standardized workflows
- **Docker**: Container development and testing
- **Kubernetes**: Local development with minikube or kind

### Automation Tools

- **GitHub Actions**: CI/CD automation
- **Dependabot**: Automated dependency updates
- **Renovate**: Automated dependency management
- **Semantic Release**: Automated release management

### Monitoring and Observability

- **Application Metrics**: Performance and usage metrics
- **Error Tracking**: Error monitoring and alerting
- **Log Aggregation**: Centralized logging and analysis
- **Distributed Tracing**: Request tracing across modules

## Conclusion

Our development workflow balances the need for rapid development with quality assurance and community engagement. By supporting multiple development modes and emphasizing upstream-first development, we create a sustainable approach that benefits both our team and the broader community.

The workflow is designed to be flexible enough to accommodate different team preferences and project requirements while maintaining consistency in quality and process. Regular review and refinement ensure the workflow continues to serve our evolving needs.

---

**Next Steps**: Review [Migration Strategy](./09-migration-strategy.md) for guidance on adopting this workflow in existing projects, or explore [Getting Started](./10-getting-started.md) for practical implementation steps.
