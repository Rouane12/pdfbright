# M9 Auth Acceptance

Before merging the auth checkpoint:

- anonymous PDF cleanup still works without an account
- `/login` renders on desktop and mobile
- requesting a magic link succeeds
- confirmation creates a valid session
- new auth user receives a matching `profiles` row
- `/account` is protected and shows the signed-in email and plan
- sign-out clears the session and returns to the anonymous product
- RLS prevents users from reading another user's account rows
- client code cannot grant itself Pro
- production dependency audit, lint, typecheck and build pass
