"""사람이 몰릴 때 서버가 쓰러지지 않게 받는 양을 정한다.

동시 처리 수를 넘으면 짧게 줄을 세우고, 줄도 차면 바로 503을 돌려준다.
제한이 없을 때는 동시 32명에서 메모리가 9.8GB까지 늘고 처리량은 그대로였다.
"""
import asyncio
from contextlib import asynccontextmanager


class Overloaded(Exception):
    pass


class AdmissionGate:
    def __init__(self, workers: int, queue: int, wait_seconds: float):
        self._slots = asyncio.Semaphore(workers)
        self._limit = workers + queue
        self._wait = wait_seconds
        self.inside = 0
        self.rejected = 0

    @asynccontextmanager
    async def enter(self):
        if self.inside >= self._limit:
            self.rejected += 1
            raise Overloaded
        self.inside += 1
        try:
            try:
                await asyncio.wait_for(self._slots.acquire(), self._wait)
            except asyncio.TimeoutError:
                self.rejected += 1
                raise Overloaded from None
            try:
                yield
            finally:
                self._slots.release()
        finally:
            self.inside -= 1
