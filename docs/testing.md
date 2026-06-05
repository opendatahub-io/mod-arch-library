# Testing (Work in Progress)

*This section is currently being developed and will provide comprehensive testing strategies and implementation guides for modular architecture.*

## Overview

Testing in a modular architecture requires a multi-layered approach that ensures individual modules work correctly in isolation and integrate seamlessly with the broader system. Our testing strategy covers unit testing, integration testing with mocks, and end-to-end testing across different deployment modes.

## Unit Testing

### Frontend Unit Testing

*Coming soon: Comprehensive frontend unit testing patterns including:*

- React component testing with React Testing Library
- Custom hooks testing strategies
- State management testing
- API client mocking patterns
- Accessibility testing requirements

### BFF Unit Testing

*Coming soon: Comprehensive BFF testing patterns including Go service unit testing, mock external service dependencies, OpenAPI contract validation, authentication/authorization testing, and error handling validation.*

#### WebSocket Toolkit and SSRF Tests

The BFF includes dedicated test suites for the WebSocket toolkit and SSRF packages:

```bash
# Run proxy and SSRF tests
go test ./internal/proxy/... ./internal/ssrf/... -v

# Run all BFF tests
go test ./... -v
```

| Package | File | Coverage |
| --- | --- | --- |
| `internal/ssrf` | `ssrf_test.go` | Private IP validation, hostname resolution, redirect checking, safe dial |
| `internal/proxy` | `tls_test.go` | TLS config creation with custom CA pools and insecure skip verify |
| `internal/proxy` | `websocket_test.go` | WebSocket upgrader, origin checking, bearer subprotocol, K8s dial auth/headers/subprotocols, bidirectional bridging, connection tracking, close code sanitization, deadline clearing |
| `internal/proxy` | `ws_tracker_test.go` | Track/untrack, stale cleanup, ping keepalive, bookmark resource version tracking |

The tests use `httptest.NewServer` for backend simulation and `gorilla/websocket` for WebSocket client connections. No external cluster is needed — all tests are self-contained and validate the WebSocket toolkit and SSRF packages in isolation regardless of deployment mode (standalone or federated).

## Integration Testing (Mock)

### Mock-Based Integration Testing

*Coming soon: Integration testing with mock services including:*

- BFF integration testing with mocked cluster APIs
- Frontend integration testing with mock BFF responses
- Module federation integration testing
- Cross-module communication testing
- Theme switching and responsive design testing

### Test Data Management

*Coming soon: Test data strategies including:*

- Mock data generation and management
- Test scenario configuration
- Data seeding for different test environments
- Performance testing with realistic data volumes

## E2E Testing

### End-to-End Testing Strategy

*Coming soon: Comprehensive E2E testing approach including:*

- Cross-browser testing strategies
- User journey testing
- Accessibility compliance testing
- Performance testing benchmarks
- Multi-deployment mode testing (Kubeflow, Federated, Standalone)

### Testing Automation

*Coming soon: Automated testing pipeline including:*

- CI/CD integration
- Automated test execution across deployment modes
- Test reporting and metrics
- Failure analysis and debugging strategies
- Regression testing protocols

## Testing Tools and Frameworks

*Coming soon: Recommended testing tools and configurations including:*

- Jest and React Testing Library setup
- Go testing frameworks and patterns
- Cypress/Playwright for E2E testing
- Mock service configurations
- Performance testing tools

## Testing Best Practices

*Coming soon: Best practices and guidelines including:*

- Test organization and structure
- Test coverage requirements
- Testing pyramid implementation
- Continuous testing strategies
- Quality gates and release criteria

