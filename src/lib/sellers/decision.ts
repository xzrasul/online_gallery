export function decideApplicationOutcome(
  decision: 'approve' | 'reject',
  reason?: string,
) {
  if (decision === 'approve') {
    return {
      role: 'seller' as const,
      applicationStatus: 'approved' as const,
      rejectionReason: null,
    };
  }
  return {
    role: 'buyer' as const,
    applicationStatus: 'rejected' as const,
    rejectionReason: reason ?? null,
  };
}
