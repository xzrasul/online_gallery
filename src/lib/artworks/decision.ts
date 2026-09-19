export function decideArtworkOutcome(decision: 'approve' | 'reject', reason?: string) {
  if (decision === 'approve') {
    return {
      status: 'published' as const,
      rejectionReason: null,
    };
  }
  return {
    status: 'rejected' as const,
    rejectionReason: reason ?? null,
  };
}
