# User Flows — Quick Guide

This guide walks through the main UI flows. Screenshots can be added under `docs/images/` and linked here.

## Login
- Open the app.
- Enter email and password created by seed (e.g., `admin@example.com` / `dev-hash`).
- On success, you are redirected to the dashboard; a JWT is stored locally.

## Collaborators
- List view: search by name; filter by status; sort and paginate.
- Create: click “New Collaborator”, fill full name, CPF (validated), birth date, position, and optional department; submit.
- Edit: click a row to edit details; save changes.
- Toggle status: use the action on the row to activate/inactivate a collaborator.
- Empty and error states: the list shows skeletons while loading and informative empty/error messages.

## Certificates
- Create new: click “New Certificate”.
  - Select collaborator.
  - Set dates; `days` is calculated or can be set (max 365).
  - ICD: type to search (debounced) via WHO ICD API; select a result.
  - Optional notes; submit to create.
- List and filters: filter by collaborator, period, and CID; sort and paginate.
- Cancel: use the action menu on a certificate to cancel/update status.

## ICD Search behavior
- On WHO ICD failure (e.g., network or rate limit), the backend falls back to the local cache.
- The UI shows a subtle indicator when a fallback is used.

## Access control
- Protected routes require login. Admin-only routes require the `admin` role.
- On 401 the app clears the session and redirects to login.
