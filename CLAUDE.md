# Project Overview

## Project Components
- Web app handling BTC flow
- Dashboard for management
- Apollo server

## Key Details
- Global eSIM platform
- Working with 3rd party for eSIM bundles
- Collaborative development process with code review

## Development Practices
- Always use graphql-codegen

## Authentication Flow Architecture

### Overview
The application implements a comprehensive authentication system with multiple sign-in methods and seamless user experience integration.

### Authentication Methods
1. **Phone OTP**: Primary authentication method using SMS verification
2. **Apple Sign-In**: Social authentication with Apple ID
3. **Google Sign-In**: Social authentication with Google account

### Key Components

#### Frontend Components
- **`/src/components/login-form.tsx`**: Main login form with all authentication methods
- **`/src/components/login-modal.tsx`**: Modal wrapper for login form with responsive design
- **`/src/hooks/useAuth.ts`**: Authentication state management hook
- **`/src/hooks/usePhoneOTP.ts`**: Phone OTP flow management
- **`/src/hooks/useAppleSignIn.ts`**: Apple authentication integration
- **`/src/hooks/useGoogleSignIn.ts`**: Google authentication integration

#### Authentication Flow States
1. **Landing Page Avatar Click**:
   - **Unauthenticated**: Opens login modal (`LoginModal`)
   - **Authenticated**: Direct link to profile page
   
2. **Login Modal**:
   - **Responsive**: 420px max-width on desktop, full-width on mobile
   - **Multi-method**: Phone OTP, Apple, Google sign-in options
   - **Success handling**: Redirects to profile page after successful authentication

3. **Profile Page**:
   - **Real Data Integration**: Connected to backend GraphQL queries
   - **Active eSIM Display**: Shows current plan, usage, and expiry data
   - **Order History**: Real-time order tracking from database

### Authentication Hook (`useAuth`)
- **Conditional Queries**: Only makes ME query when auth token exists
- **Token Management**: Handles localStorage token lifecycle
- **Error Handling**: Automatic token cleanup on auth errors
- **State Management**: Consistent authentication state across app

### GraphQL Integration
- **ME Query**: `query Me { me { id, email, firstName, lastName, phoneNumber } }`
- **Conditional Execution**: Skipped when no auth token present
- **Error Handling**: Automatic token cleanup on UNAUTHORIZED errors

### Profile Page Data Flow
- **User Data**: Real user information from ME query
- **eSIM Data**: Active plan information from `GET_ACTIVE_ESIM_PLAN` query
- **Order History**: Real order data from `GetUserOrders` query
- **Mock Data Elimination**: Replaced all mock data with real backend integration

### Best Practices Implemented
1. **Conditional API Calls**: Prevent unnecessary queries for unauthenticated users
2. **Responsive Design**: Modal adapts to screen size appropriately
3. **Error Boundaries**: Graceful handling of authentication failures
4. **State Consistency**: Unified authentication state across components
5. **Token Security**: Automatic cleanup of expired/invalid tokens

### Performance Optimizations
- **Query Skipping**: ME query only runs when auth token exists
- **Cache Management**: Efficient Apollo Client caching strategy
- **Loading States**: Proper loading indicators during authentication
- **Error Recovery**: Automatic retry mechanisms for failed auth attempts

## Package Management
- Using bun as package manager

## Git Commit Guidelines
When making commits, organize changes by feature and create clean, focused commits:

1. **Stage specific files**: Use `git add <specific-files>` to stage only related changes
2. **Review staged files**: Use `git diff --cached --name-only` to review what will be committed
3. **Commit format**: Use descriptive commit messages with this structure:
   ```
   type: brief description
   
   - Detailed bullet points of what was changed
   - Include file locations for major changes
   - Explain the "why" not just the "what"
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
4. **Separate concerns**: Create separate commits for different features (e.g., validation flow vs URL state management)
5. **Include context**: Reference relevant documentation or API recommendations when applicable