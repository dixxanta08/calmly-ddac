// components/ClientSessionWrapper.js

"use client";

import { SessionProvider } from "next-auth/react";

export default function ClientSessionWrapper({ children, session }) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
}
