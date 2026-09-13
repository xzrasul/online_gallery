interface ClerkUserCreatedPayload {
  type: string;
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: Array<{ id: string; email_address: string }>;
    primary_email_address_id: string;
  };
}

export function parseClerkUserCreated(payload: unknown) {
  const { data } = payload as ClerkUserCreatedPayload;
  const primaryEmail = data.email_addresses.find(
    (addr) => addr.id === data.primary_email_address_id,
  );
  if (!primaryEmail) {
    throw new Error('Clerk user.created payload has no primary email address');
  }
  return {
    clerkUserId: data.id,
    email: primaryEmail.email_address,
    fullName: [data.first_name, data.last_name].filter(Boolean).join(' '),
  };
}
