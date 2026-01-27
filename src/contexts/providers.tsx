'use client';
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { KBarComponent } from './kbar-provider';

export default function Providers({
  session,
  children
}: {
  session: any;
  children: React.ReactNode;
}) {
  return (
    <KBarComponent>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider session={session}>{children}</SessionProvider>
      </ThemeProvider>
    </KBarComponent>
  );
}
