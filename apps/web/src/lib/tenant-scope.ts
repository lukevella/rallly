// Tenant-scope types live in lib rather than features/space so content
// features (poll, scheduled-event, event-types) can type their
// parameterized reads without importing the space feature: space imports
// scheduled-event for its own loaders, so the reverse import would create
// a feature cycle. features/space/types re-exports both, which keeps the
// documented import path working for everything else.

// Tenant scope proven by auth. Minted only by the session gate and the API
// key middleware; parameterized DAL reads require it.
export type AuthorizedSpaceId = string & {
  readonly __brand: "AuthorizedSpaceId";
};

// Visibility scope for space-scoped content reads. Built from the session
// via createSpaceContentScope (spaceProcedure, loaders); API key handlers
// mint { spaceId } directly — a space-level credential sees everything.
export type SpaceContentScope = {
  spaceId: AuthorizedSpaceId;
  // When set, reads must only return content created by this user: the
  // requester is a member of a space where members work independently.
  // Uniform across roles — admins and owners are restricted too.
  createdBy?: string;
};
