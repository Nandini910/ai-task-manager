import React from "react";

export default function BlogLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <section style={{ padding: "20px",margin: "10px", backgroundColor: "#ce8fe1" }}>
            <h1>Blog</h1>
            {children}
        </section>
    )
}