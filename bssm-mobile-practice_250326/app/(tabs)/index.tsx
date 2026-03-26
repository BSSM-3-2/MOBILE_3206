import MOCK_POSTS from '@/mock/posts';
import ContentContainer from '@components/container';
import { FeedList } from '@components/feed/FeedList';
import NavigationTop from '@components/navigation/NavigationTop';
import { ThemedView } from '@components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, View } from 'react-native';

export default function HomeScreen() {
    return (
        <ThemedView style={{ flex: 1 }}>
            <ContentContainer isTopElement={true}>
                <NavigationTop
                    title='MyFeed'
                    icon={'layers'}
                    rightButtons={
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 15,
                            }}
                        >
                            <Ionicons
                                name='add-outline'
                                size={24}
                                color='#262626'
                            />
                        </View>
                    }
                />
            </ContentContainer>

            {/* 피드 정보 렌더링 */}
            <FlatList
                data={MOCK_POSTS}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <FeedList posts={[item]} />}
            />
        </ThemedView>
    );
}
