import { Grid } from '@/constants/theme';
import { resolveImageSource } from '@/utils/image';
import { ThemedView } from '@components/themed-view';
import { Post } from '@type/Post';
import { Image } from 'expo-image';
import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / Grid.profileColumnCount;

export default function ProfileFeedList({ posts }: { posts: Post[] }) {
    return (
        <ThemedView style={styles.container}>
            {posts.map(item => (
                <Image
                    style={styles.image}
                    contentFit={'cover'}
                    source={resolveImageSource(item.images[0])}
                    key={item.id}
                />
            ))}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    image: {
        height: ITEM_SIZE * Grid.profileImageRatio,
        width: ITEM_SIZE - Grid.gap * 2,
        marginRight: Grid.gap,
        marginBottom: Grid.gap,
    },
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});
