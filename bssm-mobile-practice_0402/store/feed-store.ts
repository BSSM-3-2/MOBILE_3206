import { create } from 'zustand';
import { Post } from '@type/Post';
import { getFeed } from '@/api/content';
// TODO: (5차) toggleLike 구현 시 필요한 함수를 import에 추가한다
import { likePost, unlikePost } from '@/api/content';

interface FeedState {
    posts: Post[];
    page: number;
    hasNext: boolean;
    loading: boolean;
    error: string | null;

    fetchFeed: () => Promise<void>;
    loadMore: () => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
    posts: [],
    page: 1,
    hasNext: false,
    loading: false,
    error: null,

    fetchFeed: async () => {
        // TODO: (4차) set()으로 loading을 켜고, getFeed(1)를 호출해 posts/pagination을 저장한다
        // 힌트: try/catch로 감싸고 실패 시 error 메시지도 저장한다
        set({ loading: true, error: null });
        try {
            const { data, pagination } = await getFeed(1);
            set({
                posts: data,
                page: 1,
                hasNext: pagination.hasNext,
                loading: false,
            });
        } catch (e) {
            set({ error: 'Failed to fetch feed', loading: false });
        }
    },

    loadMore: async () => {
        const { loading, hasNext, page, posts } = get();
        if (loading || !hasNext) return;

        set({ loading: true });
        try {
            const nextPage = page + 1;
            const { data, pagination } = await getFeed(nextPage);
            set({
                posts: [...posts, ...data],
                page: nextPage,
                hasNext: pagination.hasNext,
                loading: false,
            });
        } catch (e) {
            set({ loading: false });
        }
    },

    // 낙관적 업데이트: UI를 먼저 바꾸고 API 호출 → 실패 시 원상복구
    toggleLike: async (postId: string) => {
        const { posts } = get();
        const target = posts.find(p => p.id === postId);
        if (!target) return;

        // ① UI 즉시 반영 (낙관적 업데이트)
        const updatedPosts = posts.map(post =>
            post.id === postId
                ? {
                      ...post,
                      liked: !post.liked,
                      likesCount: post.liked ? post.likes - 1 : post.likes + 1,
                  }
                : post,
        );
        set({ posts: updatedPosts });

        try {
            // ② API 호출
            if (target.liked) {
                await unlikePost(postId);
            } else {
                await likePost(postId);
            }
            // ③ 성공 시 서버 응답으로 동기화 (이미 UI는 반영됨)
        } catch (error) {
            // ④ 실패 시 롤백 - get().posts 사용 (최신 상태)
            const currentPosts = get().posts;
            const rollbackPosts = currentPosts.map(post =>
                post.id === postId
                    ? {
                          ...post,
                          liked: target.liked,
                          likesCount: target.likes,
                      }
                    : post,
            );
            set({ posts: rollbackPosts });
        }
    },
}));
