'use client';

import { useEffect, useState } from 'react';
import { fetchUserInfo, UserInfo } from './userService';

// 사용자 정보를 화면끼리 나눠 쓴다.
// 예전에는 설정·마이페이지에 들어갈 때마다 처음부터 다시 받고, 받는 동안 화면 전체를 "로딩 중"으로 바꿨다.
// 이제 한 번 받은 값은 바로 보여 주고, 뒤에서 새로 받아 바뀐 것만 고친다.
// 메모리에만 둔다 (새로고침하면 사라진다). 개인정보를 저장소에 남기지 않기 위해서다.

type State = { data: UserInfo | null; failed: boolean };

let cache: UserInfo | null = null;
let inflight: Promise<UserInfo | null> | null = null;
const listeners = new Set<(s: State) => void>();

function emit(s: State) {
    listeners.forEach((l) => l(s));
}

/** 같은 시각에 여러 화면이 불러도 요청은 한 번만 보낸다. */
export function loadUserInfo(): Promise<UserInfo | null> {
    if (!inflight) {
        inflight = fetchUserInfo().then((data) => {
            inflight = null;
            if (data) {
                cache = data;
                localStorage.setItem('userName', data.userDataResponse.name);
            }
            emit({ data: data ?? cache, failed: !data && !cache });
            return data;
        });
    }
    return inflight;
}

/** 탭을 누르는 순간 미리 받아 둔다. 이미 있으면 아무것도 하지 않는다. */
export function prefetchUserInfo() {
    if (!cache) void loadUserInfo();
}

/** 로그인·로그아웃·탈퇴·정보 수정 뒤에 부른다. 다른 사람 정보가 남지 않게 한다. */
export function clearUserInfo() {
    cache = null;
}

export function useUserInfo() {
    const [state, setState] = useState<State>({ data: cache, failed: false });

    useEffect(() => {
        listeners.add(setState);
        void loadUserInfo(); // 값이 있어도 뒤에서 새로 받는다
        return () => {
            listeners.delete(setState);
        };
    }, []);

    return {
        userInfo: state.data,
        loading: !state.data && !state.failed,
        failed: state.failed,
    };
}
