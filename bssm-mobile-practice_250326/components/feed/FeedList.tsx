import { StyleSheet } from 'react-native';
import { Post } from '@type/Post';
import { FeedPost } from './post/FeedPost';
import { ThemedView } from '@components/themed-view';

function FeedList({ posts }: { posts: Post[] }) {
    return (
        <ThemedView style={styles.container}>
            {posts.map(item => (
                <FeedPost post={item} key={item.id} />
            ))}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});

export { FeedList };
