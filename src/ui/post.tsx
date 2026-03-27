import React from "react";

type PostProps = {
    title: string;
    content: string;
};

export const Post = ({ title, content }: PostProps) => {
    return (
        <div>
            <h2>{title}</h2>
            <p>{content}</p>
        </div>
    );
};