"use client";
import React from "react";
export const GeminiIcon = (props: React.SVGProps<SVGSVGElement>) => {

    const width = props.width || 24;
    const height = props.height || 24;

    return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 48 48`}
      baseProfile="basic"
      {...props}
    >
      <path
        fill="#3098de"
        d="M45.963 23.959c-11.907-.47-21.453-10.015-21.922-21.922L24 1l-.041 1.037C23.49 13.944 13.944 23.489 2.037 23.959L1 24l1.037.041c11.907.47 21.452 10.015 21.922 21.922L24 47l.041-1.037c.47-11.907 10.015-21.452 21.922-21.922L47 24l-1.037-.041z"
      />
    </svg>
    )
}