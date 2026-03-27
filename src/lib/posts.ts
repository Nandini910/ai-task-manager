export type PostType = {
    id: number;
    title: string;
    content: string
}

export const getPosts = async (): Promise<PostType[]> => {
    return [
        {
            id: 1,
            title: "First Post",
            content: "This is a sample post"
        },
        {
            id: 2,
            title: "Second Post",
            content: "Another example post"
        }
    ]
}