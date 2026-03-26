import { Dimensions, StyleSheet } from 'react-native';
import { Post } from '@type/Post';
import { Image } from 'expo-image';
import { resolveImageSource } from '@/utils/image';
import { Grid } from '@/constants/theme';
import { ThemedView } from '@components/themed-view';

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
        width: ITEM_SIZE - Grid.gap,
        paddingRight: 1.5 * Grid.gap,
        paddingBottom: 1.5 * Grid.gap,
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
    },
});
