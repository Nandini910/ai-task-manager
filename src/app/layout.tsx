import React from "react";
import "./globals.css";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html>
        <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        {children}
        </body>
        </html>
    )
}