import MOCK_USER from '@/mock/user';
import { ThemedView } from '@components/themed-view';

import MOCK_POSTS from '@/mock/posts';
import ContentContainer from '@components/container';
import NavigationTop from '@components/navigation/NavigationTop';
import ProfileFeedList from '@components/profile/feed/ProfileFeedList';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MOCK_USERS_MAP } from '@/mock/users';

export default function ProfileScreen() {
    const { userId } = useLocalSearchParams<{ userId?: string }>();

    const user = userId ? MOCK_USERS_MAP[userId] || MOCK_USER : MOCK_USER;
    const userPosts = MOCK_POSTS.filter(post => post.userId === user.id);

    return (
        <ThemedView style={{ flex: 1 }}>
            <ContentContainer isTopElement={true}>
                <NavigationTop title={user.username} />
            </ContentContainer>
            <FlatList
                data={userPosts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <ProfileFeedList posts={[item]} />}
                numColumns={3}
                ListHeaderComponent={
                    <ProfileHeader
                        user={user}
                        userAnalytics={{
                            post: userPosts.length,
                            follower: user.followersCount,
                            following: user.followingCount,
                        }}
                    />
                }
            />
        </ThemedView>
    );
}
