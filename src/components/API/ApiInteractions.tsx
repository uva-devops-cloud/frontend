import { useEffect, useState } from 'react';

const ApiInteractions = () => {
    // Define an interface that matches the structure of posts from the API
    interface Post {
        userId: number;
        id: number;
        title: string;
        body: string;
    }

    // Update the state to use the Post interface
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        const fetchPosts = async () => {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            const data = await response.json();
            setPosts(data);
        };

        fetchPosts();
    }, []);

    return (
        <div>
            <h1>Posts List</h1>
            <ul>
                {posts.map(post => (
                    <li key={post.id}>
                        <h3>{post.title}</h3>
                        <p><strong>User ID:</strong> {post.userId}</p>
                        <p>{post.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ApiInteractions;