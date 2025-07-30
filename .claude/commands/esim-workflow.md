# eSIM Go Development Workflow

Use this command to initiate the eSIM Go platform development workflow. The orchestrator will coordinate all specialized agents to deliver complete features from requirements to deployment.

## Usage

Simply describe what you want to build, and the orchestrator will:
1. Analyze requirements with the business analyst
2. Design the architecture
3. Implement backend and frontend code
4. Test thoroughly
5. Optimize performance
6. Ensure security compliance

## Examples

### Feature Development
```
/esim-workflow "Add support for family plan bundles where users can purchase multiple eSIMs at a discounted rate"
```

### Bug Fixes
```
/esim-workflow "Fix the issue where iOS users can't activate eSIMs directly from the app"
```

### Performance Improvements
```
/esim-workflow "Optimize the bundle catalog to load in under 500ms on mobile devices"
```

### Security Enhancements
```
/esim-workflow "Implement two-factor authentication for user accounts"
```

## Available Agents

The workflow will automatically coordinate these specialized agents:

- **esim-orchestrator**: Master coordinator for the entire workflow
- **esim-analyst**: Business requirements and user story analysis
- **esim-architect**: System design and architecture decisions
- **graphql-backend-developer**: Backend API implementation
- **react-frontend-developer**: Frontend UI implementation
- **esim-integration-specialist**: eSIM provider integrations
- **esim-tester**: Comprehensive testing strategies
- **esim-security-auditor**: Security review and compliance
- **esim-performance-optimizer**: Performance optimization

## Workflow Phases

1. **Requirements Analysis** (esim-analyst)
   - Gather detailed requirements
   - Create user stories
   - Define acceptance criteria

2. **Architecture Design** (esim-architect)
   - Design system components
   - Plan database schema
   - Define API contracts

3. **Implementation** (Multiple agents)
   - Backend development (graphql-backend-developer)
   - Frontend development (react-frontend-developer)
   - eSIM integration (esim-integration-specialist)

4. **Testing** (esim-tester)
   - Unit tests
   - Integration tests
   - End-to-end tests

5. **Optimization** (esim-performance-optimizer)
   - Performance analysis
   - Query optimization
   - Bundle size reduction

6. **Security Review** (esim-security-auditor)
   - Security audit
   - Vulnerability assessment
   - Compliance check

## Configuration

You can customize the workflow with these options:

- `--skip-phase [phase]`: Skip specific phases (e.g., `--skip-phase testing`)
- `--priority [aspect]`: Prioritize specific aspects (e.g., `--priority performance`)
- `--quick`: Fast-track development with minimal documentation
- `--comprehensive`: Full documentation and extensive testing

## Notes

- The orchestrator will provide regular progress updates
- Each agent works in their specialized domain
- All code follows the eSIM Go platform standards
- Security and performance are always considered
