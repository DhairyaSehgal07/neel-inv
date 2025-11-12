'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <main className="flex flex-col items-center text-center space-y-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="https://github.com/evilrabbit.png"
            alt="Neelkanth Rubber Mills Logo"
            width={80}
            height={80}
            className="rounded-full"
          />
          <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100">
            Neelkanth Rubber Mills
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">Inventory Management System</p>
        </div>

        {/* Tagline */}
        <p className="max-w-md text-zinc-700 dark:text-zinc-300 leading-relaxed">
          Efficiently track, monitor, and manage your factory’s inventory in real-time — built for
          precision and performance.
        </p>

        {/* Sign In Button */}
        <Link href="sign-in">
          <Button size="lg" className="rounded-full px-8">
            Sign In
          </Button>
        </Link>

        {/* Optional Footer */}
        <footer className="text-sm text-zinc-500 dark:text-zinc-400 mt-12">
          © {new Date().getFullYear()} Neelkanth Rubber Mills. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
