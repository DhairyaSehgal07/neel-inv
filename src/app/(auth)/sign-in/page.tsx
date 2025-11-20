'use client';

import { Suspense } from 'react';
import { SignIn } from '@/components/sign-in';

function SignInContent() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignIn />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <SignInContent />
    </Suspense>
  );
}
