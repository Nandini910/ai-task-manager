import SearchBar from "./Client";

export default async function Page({
                                       params,
                                       searchParams
                                   }: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ sort?: string; comments?: string }>
}) {
    const { slug } = await params
    const { sort, comments } = await searchParams

    return (
        <div>
            <h1>Post: {slug}</h1>
            <p>Sort: {sort}</p>
            <p>Comments: {comments}</p>
            <SearchBar />
        </div>
    )
}